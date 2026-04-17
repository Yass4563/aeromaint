import bcrypt from "bcryptjs";
import {
  EquipementStatut,
  MaintenanceType,
  Periodicite,
  PrismaClient,
  Role,
  TaskStatut,
} from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number) {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

async function seedReferences() {
  const services = [
    "Electronique",
    "Informatique",
    "Telecoms",
    "Electricite balisage",
    "Depart sous douane",
    "Mecanique",
    "Surete",
  ];

  const familles = [
    "Rayon X",
    "Detecteurs de traces d'explosifs et de stupefiants",
    "Imprimante",
    "Teleaffichage",
    "Balisage",
    "Telephone",
    "Portique detecteur de metaux",
    "Autre",
  ];

  const zones = [
    "Depart tri bagages",
    "Depart sous douane",
    "Arrivee",
    "Administration",
    "ESU",
    "Piste",
    "Surete",
  ];

  for (const nom of services) {
    await prisma.service.upsert({
      where: { nom },
      update: {},
      create: { nom },
    });
  }

  for (const nom of familles) {
    await prisma.famille.upsert({
      where: { nom },
      update: {},
      create: { nom },
    });
  }

  for (const nom of zones) {
    await prisma.zone.upsert({
      where: { nom },
      update: {},
      create: { nom },
    });
  }

  return { services: services.length, familles: familles.length, zones: zones.length };
}

async function seedUsers() {
  const [adminPassword, superviseurPassword, techPassword, techNightPassword] =
    await Promise.all([
      bcrypt.hash("Admin1234!", 12),
      bcrypt.hash("Super1234!", 12),
      bcrypt.hash("Tech1234!", 12),
      bcrypt.hash("Night1234!", 12),
    ]);

  const services = await prisma.service.findMany();
  const serviceMap = new Map(services.map((service) => [service.nom, service.id]));

  const users = [
    {
      email: "admin@aeromaint.local",
      nom: "Admin",
      prenom: "AeroMaint",
      role: Role.ADMIN,
      passwordHash: adminPassword,
      serviceId: serviceMap.get("Electronique"),
    },
    {
      email: "superviseur@aeromaint.local",
      nom: "Chef",
      prenom: "Equipe",
      role: Role.SUPERVISEUR,
      passwordHash: superviseurPassword,
      serviceId: serviceMap.get("Electronique"),
    },
    {
      email: "tech@aeromaint.local",
      nom: "Technicien",
      prenom: "Demo",
      role: Role.TECHNICIEN,
      passwordHash: techPassword,
      serviceId: serviceMap.get("Electronique"),
    },
    {
      email: "tech2@aeromaint.local",
      nom: "Equipe",
      prenom: "Nuit",
      role: Role.TECHNICIEN,
      passwordHash: techNightPassword,
      serviceId: serviceMap.get("Surete"),
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        passwordHash: user.passwordHash,
        serviceId: user.serviceId,
        actif: true,
      },
      create: {
        ...user,
        actif: true,
      },
    });
  }

  return users.length;
}

async function seedBusinessDemo() {
  const [services, familles, zones, users] = await Promise.all([
    prisma.service.findMany(),
    prisma.famille.findMany(),
    prisma.zone.findMany(),
    prisma.user.findMany(),
  ]);

  const serviceMap = new Map(services.map((item) => [item.nom, item.id]));
  const familleMap = new Map(familles.map((item) => [item.nom, item.id]));
  const zoneMap = new Map(zones.map((item) => [item.nom, item.id]));
  const userMap = new Map(users.map((item) => [item.email, item.id]));

  const sampleEquipments = [
    {
      code: "AM-RX-001",
      qrCode: "0d1e67d9-8b43-4e46-9d88-3bd1f27d2001",
      nom: "Scanner bagages T1",
      marque: "Smiths Detection",
      numeroSerie: "RX-ESU-001",
      service: "Electronique",
      famille: "Rayon X",
      zone: "Depart tri bagages",
      statut: EquipementStatut.EN_SERVICE,
      prixAcquisition: 380000,
      modeIntegre: true,
      qrAppose: true,
      remarques: "Unite prioritaire pour le flux depart.",
      miseEnService: daysFromNow(-420),
      remplacementPrevu: daysFromNow(220),
    },
    {
      code: "AM-TEL-014",
      qrCode: "0d1e67d9-8b43-4e46-9d88-3bd1f27d2002",
      nom: "Pupitre telecom piste",
      marque: "Motorola",
      numeroSerie: "TEL-PS-014",
      service: "Telecoms",
      famille: "Telephone",
      zone: "Piste",
      statut: EquipementStatut.EN_SERVICE,
      prixAcquisition: 25000,
      modeIntegre: false,
      qrAppose: true,
      remarques: "Controle quotidien en saison haute.",
      miseEnService: daysFromNow(-250),
      remplacementPrevu: daysFromNow(420),
    },
    {
      code: "AM-BAL-003",
      qrCode: "0d1e67d9-8b43-4e46-9d88-3bd1f27d2003",
      nom: "Armoire balisage P3",
      marque: "ADB Safegate",
      numeroSerie: "BAL-P3-003",
      service: "Electricite balisage",
      famille: "Balisage",
      zone: "Piste",
      statut: EquipementStatut.EN_SERVICE,
      prixAcquisition: 117000,
      modeIntegre: true,
      qrAppose: true,
      remarques: "A realiser de preference de nuit.",
      miseEnService: daysFromNow(-540),
      remplacementPrevu: daysFromNow(360),
    },
    {
      code: "AM-SUR-008",
      qrCode: "0d1e67d9-8b43-4e46-9d88-3bd1f27d2004",
      nom: "Portique surete B",
      marque: "CEIA",
      numeroSerie: "SUR-B-008",
      service: "Surete",
      famille: "Portique detecteur de metaux",
      zone: "Surete",
      statut: EquipementStatut.EN_SERVICE,
      prixAcquisition: 97000,
      modeIntegre: false,
      qrAppose: true,
      remarques: "Validation superviseur obligatoire avant cloture.",
      miseEnService: daysFromNow(-680),
      remplacementPrevu: daysFromNow(280),
    },
    {
      code: "AM-AFF-009",
      qrCode: "0d1e67d9-8b43-4e46-9d88-3bd1f27d2005",
      nom: "Ecran teleaffichage Arrivee",
      marque: "Samsung",
      numeroSerie: "AFF-AR-009",
      service: "Informatique",
      famille: "Teleaffichage",
      zone: "Arrivee",
      statut: EquipementStatut.EN_PANNE,
      prixAcquisition: 54000,
      modeIntegre: true,
      qrAppose: false,
      remarques: "En attente de piece de remplacement.",
      miseEnService: daysFromNow(-730),
      remplacementPrevu: daysFromNow(180),
      dateArret: daysFromNow(-10),
    },
    {
      code: "AM-IMP-002",
      qrCode: "0d1e67d9-8b43-4e46-9d88-3bd1f27d2006",
      nom: "Imprimante cartes acces",
      marque: "Zebra",
      numeroSerie: "IMP-ACC-002",
      service: "Administration",
      famille: "Imprimante",
      zone: "Administration",
      statut: EquipementStatut.HORS_SERVICE,
      prixAcquisition: 18000,
      modeIntegre: false,
      qrAppose: false,
      remarques: "Maintenue en historique pour tests de filtre.",
      miseEnService: daysFromNow(-920),
      remplacementPrevu: daysFromNow(-60),
      dateArret: daysFromNow(-45),
    },
  ];

  const equipmentIds: string[] = [];

  for (const item of sampleEquipments) {
    const equipement = await prisma.equipement.upsert({
      where: { code: item.code },
      update: {
        nom: item.nom,
        qrCode: item.qrCode,
        marque: item.marque,
        numeroSerie: item.numeroSerie,
        familleId: familleMap.get(item.famille),
        zoneId: zoneMap.get(item.zone),
        serviceId: serviceMap.get(item.service) ?? serviceMap.get("Electronique"),
        statut: item.statut,
        prixAcquisition: item.prixAcquisition,
        modeIntegre: item.modeIntegre,
        qrAppose: item.qrAppose,
        remarques: item.remarques,
        miseEnService: item.miseEnService,
        remplacementPrevu: item.remplacementPrevu,
        dateArret: "dateArret" in item ? item.dateArret ?? null : null,
      },
      create: {
        nom: item.nom,
        code: item.code,
        qrCode: item.qrCode,
        marque: item.marque,
        numeroSerie: item.numeroSerie,
        familleId: familleMap.get(item.famille)!,
        zoneId: zoneMap.get(item.zone)!,
        serviceId: serviceMap.get(item.service) ?? serviceMap.get("Electronique")!,
        statut: item.statut,
        prixAcquisition: item.prixAcquisition,
        modeIntegre: item.modeIntegre,
        qrAppose: item.qrAppose,
        remarques: item.remarques,
        miseEnService: item.miseEnService,
        remplacementPrevu: item.remplacementPrevu,
        dateArret: "dateArret" in item ? item.dateArret ?? null : null,
      },
    });

    equipmentIds.push(equipement.id);
  }

  await prisma.planning.deleteMany({
    where: {
      equipementId: { in: equipmentIds },
    },
  });

  const equipmentByCode = new Map(
    (await prisma.equipement.findMany({
      where: { code: { in: sampleEquipments.map((item) => item.code) } },
    })).map((item) => [item.code, item.id]),
  );

  const planningSpecs = [
    {
      equipementCode: "AM-RX-001",
      type: MaintenanceType.ENTRETIEN,
      periodicite: Periodicite.MENSUELLE,
      dateDebut: daysFromNow(-30),
      eviterWeekend: true,
      nuit: false,
      technicienId: userMap.get("tech@aeromaint.local")!,
    },
    {
      equipementCode: "AM-TEL-014",
      type: MaintenanceType.ETALONNAGE,
      periodicite: Periodicite.HEBDOMADAIRE,
      dateDebut: daysFromNow(-14),
      eviterWeekend: false,
      nuit: false,
      technicienId: userMap.get("tech@aeromaint.local")!,
    },
    {
      equipementCode: "AM-BAL-003",
      type: MaintenanceType.CONTROLES_REGLEMENTAIRES,
      periodicite: Periodicite.TRIMESTRIELLE,
      dateDebut: daysFromNow(-20),
      eviterWeekend: true,
      nuit: true,
      technicienId: userMap.get("tech2@aeromaint.local")!,
    },
    {
      equipementCode: "AM-SUR-008",
      type: MaintenanceType.ENTRETIEN,
      periodicite: Periodicite.MENSUELLE,
      dateDebut: daysFromNow(-12),
      eviterWeekend: false,
      nuit: false,
      technicienId: userMap.get("tech@aeromaint.local")!,
    },
    {
      equipementCode: "AM-AFF-009",
      type: MaintenanceType.ENTRETIEN,
      periodicite: Periodicite.SEMESTRIELLE,
      dateDebut: daysFromNow(-60),
      eviterWeekend: true,
      nuit: false,
      technicienId: userMap.get("tech2@aeromaint.local")!,
    },
  ];

  const planningMap = new Map<string, string>();

  for (const spec of planningSpecs) {
    const planning = await prisma.planning.create({
      data: {
        equipementId: equipmentByCode.get(spec.equipementCode)!,
        type: spec.type,
        periodicite: spec.periodicite,
        dateDebut: spec.dateDebut,
        eviterWeekend: spec.eviterWeekend,
        nuit: spec.nuit,
        technicienId: spec.technicienId,
        actif: true,
      },
    });

    planningMap.set(spec.equipementCode, planning.id);
  }

  const taskRecords = [
    {
      planningCode: "AM-RX-001",
      equipementCode: "AM-RX-001",
      technicienId: userMap.get("tech@aeromaint.local")!,
      datePrevue: daysFromNow(-3),
      statut: TaskStatut.OUVERTE,
    },
    {
      planningCode: "AM-TEL-014",
      equipementCode: "AM-TEL-014",
      technicienId: userMap.get("tech@aeromaint.local")!,
      datePrevue: daysFromNow(0),
      statut: TaskStatut.OUVERTE,
    },
    {
      planningCode: "AM-BAL-003",
      equipementCode: "AM-BAL-003",
      technicienId: userMap.get("tech2@aeromaint.local")!,
      datePrevue: daysFromNow(4),
      statut: TaskStatut.OUVERTE,
    },
    {
      planningCode: "AM-SUR-008",
      equipementCode: "AM-SUR-008",
      technicienId: userMap.get("tech@aeromaint.local")!,
      datePrevue: daysFromNow(-1),
      statut: TaskStatut.SOUMISE,
      soumisLe: daysFromNow(-1),
      report: {
        description: "Controle de l'arche et verification des capteurs lateraux. RAS, attente validation superviseur.",
        dateIntervention: daysFromNow(-1),
        soumisParId: userMap.get("tech@aeromaint.local")!,
      },
    },
    {
      planningCode: "AM-BAL-003",
      equipementCode: "AM-BAL-003",
      technicienId: userMap.get("tech2@aeromaint.local")!,
      datePrevue: daysFromNow(-7),
      statut: TaskStatut.VALIDEE,
      soumisLe: daysFromNow(-7),
      valideLe: daysFromNow(-7),
      valideParId: userMap.get("superviseur@aeromaint.local")!,
      commentaireValidation: "Intervention conforme et realisee dans les delais.",
      report: {
        description: "Controle reglementaire realise de nuit avec verification de la tension et des armoires.",
        dateIntervention: daysFromNow(-7),
        soumisParId: userMap.get("tech2@aeromaint.local")!,
      },
    },
    {
      planningCode: "AM-AFF-009",
      equipementCode: "AM-AFF-009",
      technicienId: userMap.get("tech2@aeromaint.local")!,
      datePrevue: daysFromNow(-12),
      statut: TaskStatut.REJETEE,
      soumisLe: daysFromNow(-11),
      rejeteLe: daysFromNow(-10),
      rejeteParId: userMap.get("superviseur@aeromaint.local")!,
      commentaireValidation: "Merci de completer le diagnostic et de joindre la date precise d'intervention.",
      report: {
        description: "Diagnostic initial realise. Panne confirmee sur la carte d'alimentation, details a completer.",
        dateIntervention: daysFromNow(-11),
        soumisParId: userMap.get("tech2@aeromaint.local")!,
      },
    },
    {
      planningCode: "AM-TEL-014",
      equipementCode: "AM-TEL-014",
      technicienId: userMap.get("tech@aeromaint.local")!,
      datePrevue: daysFromNow(-20),
      statut: TaskStatut.CLOTUREE,
      soumisLe: daysFromNow(-19),
      valideLe: daysFromNow(-18),
      valideParId: userMap.get("superviseur@aeromaint.local")!,
      commentaireValidation: "Historique cloture pour le mois precedent.",
      report: {
        description: "Etalonnage de reference effectue sur le pupitre telecom.",
        dateIntervention: daysFromNow(-19),
        soumisParId: userMap.get("tech@aeromaint.local")!,
      },
    },
  ];

  let tasksCount = 0;
  let reportsCount = 0;

  for (const item of taskRecords) {
    const task = await prisma.task.create({
      data: {
        planningId: planningMap.get(item.planningCode)!,
        equipementId: equipmentByCode.get(item.equipementCode)!,
        technicienId: item.technicienId,
        datePrevue: item.datePrevue,
        statut: item.statut,
        soumisLe: "soumisLe" in item ? item.soumisLe ?? null : null,
        valideLe: "valideLe" in item ? item.valideLe ?? null : null,
        valideParId: "valideParId" in item ? item.valideParId ?? null : null,
        rejeteLe: "rejeteLe" in item ? item.rejeteLe ?? null : null,
        rejeteParId: "rejeteParId" in item ? item.rejeteParId ?? null : null,
        commentaireValidation:
          "commentaireValidation" in item ? item.commentaireValidation ?? null : null,
      },
    });

    tasksCount += 1;

    if ("report" in item && item.report) {
      await prisma.rapportMaintenance.create({
        data: {
          taskId: task.id,
          description: item.report.description,
          dateIntervention: item.report.dateIntervention,
          soumisParId: item.report.soumisParId,
        },
      });

      reportsCount += 1;
    }
  }

  return {
    equipements: sampleEquipments.length,
    plannings: planningSpecs.length,
    tasks: tasksCount,
    rapports: reportsCount,
  };
}

async function main() {
  const refs = await seedReferences();
  const users = await seedUsers();
  const demo = await seedBusinessDemo();

  console.log("Seed termine.");
  console.log(`Services inseres : ${refs.services}`);
  console.log(`Familles inserees : ${refs.familles}`);
  console.log(`Zones inserees : ${refs.zones}`);
  console.log(`Utilisateurs inseres ou mis a jour : ${users}`);
  console.log(`Equipements de test : ${demo.equipements}`);
  console.log(`Plannings de test : ${demo.plannings}`);
  console.log(`Taches de test : ${demo.tasks}`);
  console.log(`Rapports de test : ${demo.rapports}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
