import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { deflateSync } from "zlib";

import bcrypt from "bcryptjs";
import { config } from "dotenv";
import {
  MaintenanceType,
  PrismaClient,
  TaskStatut,
} from "@prisma/client";

import { getDatabaseCounts, wipePresentationData } from "./data-reset";
import {
  presentationEquipments,
  presentationFamilies,
  presentationServices,
  presentationUsers,
  presentationZones,
} from "./presentation-data";

config({ path: ".env.local" });
config();

const prisma = new PrismaClient();
const PRESENTATION_PASSWORD = "Presentation123!";

function daysFromNow(days: number, hours = 9) {
  const date = new Date();
  date.setHours(hours, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function addHours(date: Date, hours: number) {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (let index = 0; index < buffer.length; index += 1) {
    const byte = buffer[index];
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);

  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));

  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function createInspectionPng(color: [number, number, number]) {
  const width = 320;
  const height = 180;
  const rows: Buffer[] = [];

  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0;

    for (let x = 0; x < width; x += 1) {
      const stripe = (x + y) % 48 < 6 ? 24 : 0;
      const offset = 1 + x * 3;
      row[offset] = Math.min(255, color[0] + stripe);
      row[offset + 1] = Math.min(255, color[1] + stripe);
      row[offset + 2] = Math.min(255, color[2] + stripe);
    }

    rows.push(row);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;

  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(Buffer.concat(rows))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

async function createPresentationUploads() {
  const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "public/uploads");
  const directory = path.join(uploadRoot, "presentation");
  const assets = [
    { name: "controle-balisage.png", color: [22, 78, 99] as [number, number, number] },
    { name: "inspection-convoyeur.png", color: [137, 83, 35] as [number, number, number] },
    { name: "verification-surete.png", color: [69, 93, 122] as [number, number, number] },
    { name: "controle-energie.png", color: [45, 109, 74] as [number, number, number] },
  ];

  await mkdir(directory, { recursive: true });

  for (const asset of assets) {
    await writeFile(path.join(directory, asset.name), createInspectionPng(asset.color));
  }

  return Object.fromEntries(
    assets.map((asset) => [asset.name, `/uploads/presentation/${asset.name}`]),
  );
}

function reportDescription(nom: string, type: MaintenanceType) {
  if (type === MaintenanceType.ETALONNAGE) {
    return `Etalonnage realise sur ${nom}. Mesures comparees a la reference constructeur, valeurs dans les tolerances et remise en service confirmee.`;
  }

  if (type === MaintenanceType.CONTROLES_REGLEMENTAIRES) {
    return `Controle reglementaire realise sur ${nom}. Verification des organes de securite, essais fonctionnels et consignation des mesures effectues.`;
  }

  return `Entretien preventif realise sur ${nom}. Nettoyage, controle visuel, verification des connexions et essai fonctionnel sans anomalie bloquante.`;
}

async function seedReferences() {
  for (const nom of presentationServices) {
    await prisma.service.upsert({ where: { nom }, update: {}, create: { nom } });
  }
  for (const nom of presentationFamilies) {
    await prisma.famille.upsert({ where: { nom }, update: {}, create: { nom } });
  }
  for (const nom of presentationZones) {
    await prisma.zone.upsert({ where: { nom }, update: {}, create: { nom } });
  }
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(PRESENTATION_PASSWORD, 12);
  const services = await prisma.service.findMany();
  const serviceMap = new Map(services.map((service) => [service.nom, service.id]));

  for (const user of presentationUsers) {
    await prisma.user.create({
      data: {
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        passwordHash,
        serviceId: serviceMap.get(user.service),
        actif: true,
      },
    });
  }
}

async function seedEquipment() {
  const [services, familles, zones] = await Promise.all([
    prisma.service.findMany(),
    prisma.famille.findMany(),
    prisma.zone.findMany(),
  ]);
  const serviceMap = new Map(services.map((item) => [item.nom, item.id]));
  const familleMap = new Map(familles.map((item) => [item.nom, item.id]));
  const zoneMap = new Map(zones.map((item) => [item.nom, item.id]));

  for (const equipment of presentationEquipments) {
    await prisma.equipement.create({
      data: {
        code: equipment.code,
        qrCode: randomUUID(),
        nom: equipment.nom,
        marque: equipment.marque,
        numeroSerie: equipment.numeroSerie,
        serviceId: serviceMap.get(equipment.service)!,
        familleId: familleMap.get(equipment.famille)!,
        zoneId: zoneMap.get(equipment.zone)!,
        statut: equipment.statut,
        prixAcquisition: equipment.prixAcquisition,
        modeIntegre: equipment.modeIntegre,
        qrAppose: equipment.qrAppose,
        remarques: equipment.remarques,
        miseEnService: daysFromNow(-equipment.miseEnServiceDaysAgo),
        remplacementPrevu: daysFromNow(equipment.remplacementDaysAhead),
        dateArret:
          equipment.dateArretDaysAgo === undefined
            ? null
            : daysFromNow(-equipment.dateArretDaysAgo),
      },
    });
  }
}

async function seedPlanningAndTasks(photoUrls: Record<string, string>) {
  const [equipements, users] = await Promise.all([
    prisma.equipement.findMany({
      where: { code: { in: presentationEquipments.map((item) => item.code) } },
    }),
    prisma.user.findMany({
      where: { email: { in: presentationUsers.map((item) => item.email) } },
    }),
  ]);
  const equipmentMap = new Map(equipements.map((item) => [item.code, item]));
  const userMap = new Map(users.map((item) => [item.email, item]));
  const supervisor = userMap.get("presentation.superviseur@aeromaint.local")!;
  let taskCount = 0;
  let reportCount = 0;
  let reportPhotoCount = 0;

  for (let index = 0; index < presentationEquipments.length; index += 1) {
    const equipment = presentationEquipments[index];
    if (!equipment.planning) {
      continue;
    }

    const databaseEquipment = equipmentMap.get(equipment.code)!;
    const technician = userMap.get(equipment.planning.technicienEmail)!;
    const planning = await prisma.planning.create({
      data: {
        equipementId: databaseEquipment.id,
        type: equipment.planning.type,
        periodicite: equipment.planning.periodicite,
        dateDebut: daysFromNow(-120),
        eviterWeekend: equipment.planning.eviterWeekend ?? false,
        nuit: equipment.planning.nuit ?? false,
        technicienId: technician.id,
        actif: true,
      },
    });

    const historicalOffsets = [-74, -46, -18];

    for (let historyIndex = 0; historyIndex < historicalOffsets.length; historyIndex += 1) {
      const offset = historicalOffsets[historyIndex];
      const datePrevue = daysFromNow(offset);
      const statut =
        historyIndex === 0 && index % 4 === 0
          ? TaskStatut.CLOTUREE
          : TaskStatut.VALIDEE;
      const photoUrl =
        index % 8 === 0 && historyIndex === 2
          ? photoUrls[
              equipment.service === "Electricite balisage"
                ? "controle-balisage.png"
                : equipment.service === "Traitement bagages"
                  ? "inspection-convoyeur.png"
                  : equipment.service === "Energie et automatismes"
                    ? "controle-energie.png"
                    : "verification-surete.png"
            ]
          : undefined;

      await prisma.task.create({
        data: {
          planningId: planning.id,
          equipementId: databaseEquipment.id,
          technicienId: technician.id,
          datePrevue,
          statut,
          soumisLe: addHours(datePrevue, -2),
          valideLe: addHours(datePrevue, index % 5 === 0 ? 3 : -1),
          valideParId: supervisor.id,
          commentaireValidation:
            index % 5 === 0
              ? "Intervention conforme. Validation realisee apres reception du compte rendu."
              : "Intervention conforme au programme preventif.",
          rapport: {
            create: {
              description: reportDescription(equipment.nom, equipment.planning.type),
              dateIntervention: addHours(datePrevue, -3),
              soumisParId: technician.id,
              ...(photoUrl
                ? {
                    photos: {
                      create: [{ url: photoUrl }],
                    },
                  }
                : {}),
            },
          },
        },
      });

      taskCount += 1;
      reportCount += 1;
      reportPhotoCount += photoUrl ? 1 : 0;
    }

    let queueOffset = [-5, -2, -1, 0, 0, 1, 3, 7, 14][index % 9];
    let queueStatus: TaskStatut = TaskStatut.OUVERTE;

    if (index % 9 === 0) {
      queueOffset = -1;
      queueStatus = TaskStatut.SOUMISE;
    } else if (index % 11 === 0) {
      queueOffset = -3;
      queueStatus = TaskStatut.REJETEE;
    }

    const queueDate = daysFromNow(queueOffset);
    const queueHasReport =
      queueStatus === TaskStatut.SOUMISE || queueStatus === TaskStatut.REJETEE;

    await prisma.task.create({
      data: {
        planningId: planning.id,
        equipementId: databaseEquipment.id,
        technicienId: technician.id,
        datePrevue: queueDate,
        statut: queueStatus,
        ...(queueHasReport
          ? {
              soumisLe: addHours(queueDate, 1),
              ...(queueStatus === TaskStatut.REJETEE
                ? {
                    rejeteLe: addHours(queueDate, 4),
                    rejeteParId: supervisor.id,
                    commentaireValidation:
                      "Rapport a completer avec les mesures relevees et la photo apres intervention.",
                  }
                : {}),
              rapport: {
                create: {
                  description:
                    queueStatus === TaskStatut.REJETEE
                      ? `Intervention realisee sur ${equipment.nom}. Compte rendu provisoire a completer apres verification des mesures.`
                      : reportDescription(equipment.nom, equipment.planning.type),
                  dateIntervention: queueDate,
                  soumisParId: technician.id,
                  photos: {
                    create: [
                      {
                        url: photoUrls[
                          equipment.service === "Traitement bagages"
                            ? "inspection-convoyeur.png"
                            : equipment.service === "Electricite balisage"
                              ? "controle-balisage.png"
                              : equipment.service === "Energie et automatismes"
                                ? "controle-energie.png"
                                : "verification-surete.png"
                        ],
                      },
                    ],
                  },
                },
              },
            }
          : {}),
      },
    });

    taskCount += 1;
    reportCount += queueHasReport ? 1 : 0;
    reportPhotoCount += queueHasReport ? 1 : 0;
  }

  return { taskCount, reportCount, reportPhotoCount };
}

async function seedEquipmentPhotos(photoUrls: Record<string, string>) {
  const equipment = await prisma.equipement.findMany({
    where: {
      code: {
        in: ["ESU-BAL-CCR-01", "ESU-BAG-CV-01", "ESU-SUR-RX-01", "ESU-ENE-GE-01"],
      },
    },
  });
  const assetByCode: Record<string, string> = {
    "ESU-BAL-CCR-01": photoUrls["controle-balisage.png"],
    "ESU-BAG-CV-01": photoUrls["inspection-convoyeur.png"],
    "ESU-SUR-RX-01": photoUrls["verification-surete.png"],
    "ESU-ENE-GE-01": photoUrls["controle-energie.png"],
  };

  await prisma.equipementPhoto.createMany({
    data: equipment.map((item) => ({
      equipementId: item.id,
      url: assetByCode[item.code!],
    })),
  });
}

async function main() {
  console.log("Nettoyage de l'ancien jeu de presentation...");
  await wipePresentationData(prisma);

  console.log("Creation du jeu de presentation enrichi...");
  const photoUrls = await createPresentationUploads();
  await seedReferences();
  await seedUsers();
  await seedEquipment();
  const tasks = await seedPlanningAndTasks(photoUrls);
  await seedEquipmentPhotos(photoUrls);

  console.log("Seed de presentation termine.");
  console.log(`Mot de passe commun aux comptes de presentation : ${PRESENTATION_PASSWORD}`);
  console.log(`Equipements de presentation : ${presentationEquipments.length}`);
  console.log(`Plannings de presentation : ${presentationEquipments.filter((item) => item.planning).length}`);
  console.log(`Taches de presentation : ${tasks.taskCount}`);
  console.log(`Rapports de presentation : ${tasks.reportCount}`);
  console.log(`Photos jointes aux rapports : ${tasks.reportPhotoCount}`);
  console.table(await getDatabaseCounts(prisma));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
