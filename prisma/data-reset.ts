import { rm } from "fs/promises";
import path from "path";

import { PrismaClient } from "@prisma/client";

import {
  presentationEquipmentCodes,
  presentationFamilies,
  presentationServices,
  presentationUserEmails,
  presentationZones,
} from "./presentation-data";

export type DatabaseCounts = {
  services: number;
  familles: number;
  zones: number;
  utilisateurs: number;
  equipements: number;
  plannings: number;
  taches: number;
  rapports: number;
  photosEquipement: number;
  photosRapport: number;
};

export async function getDatabaseCounts(
  prisma: PrismaClient,
): Promise<DatabaseCounts> {
  const [
    services,
    familles,
    zones,
    utilisateurs,
    equipements,
    plannings,
    taches,
    rapports,
    photosEquipement,
    photosRapport,
  ] = await Promise.all([
    prisma.service.count(),
    prisma.famille.count(),
    prisma.zone.count(),
    prisma.user.count(),
    prisma.equipement.count(),
    prisma.planning.count(),
    prisma.task.count(),
    prisma.rapportMaintenance.count(),
    prisma.equipementPhoto.count(),
    prisma.rapportPhoto.count(),
  ]);

  return {
    services,
    familles,
    zones,
    utilisateurs,
    equipements,
    plannings,
    taches,
    rapports,
    photosEquipement,
    photosRapport,
  };
}

function resolveUploadRoot() {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR || "public/uploads");
}

function assertUploadsDirectory(target: string) {
  const parsed = path.parse(target);

  if (
    path.basename(target).toLowerCase() !== "uploads" ||
    target === parsed.root ||
    target === process.cwd()
  ) {
    throw new Error(`Refus de supprimer le repertoire non securise : ${target}`);
  }
}

function assertChildPath(parent: string, target: string) {
  const relative = path.relative(parent, target);

  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refus de supprimer le chemin hors uploads : ${target}`);
  }
}

async function removePresentationUploads() {
  const uploadRoot = resolveUploadRoot();
  const presentationUploads = path.resolve(uploadRoot, "presentation");

  assertUploadsDirectory(uploadRoot);
  assertChildPath(uploadRoot, presentationUploads);
  await rm(presentationUploads, { recursive: true, force: true });
}

async function removeAllUploads() {
  const uploadRoot = resolveUploadRoot();

  assertUploadsDirectory(uploadRoot);
  await rm(uploadRoot, { recursive: true, force: true });
}

async function cleanupPresentationReferences(prisma: PrismaClient) {
  await prisma.service.deleteMany({
    where: {
      nom: { in: presentationServices },
      equipements: { none: {} },
      users: { none: {} },
    },
  });
  await prisma.famille.deleteMany({
    where: {
      nom: { in: presentationFamilies },
      equipements: { none: {} },
    },
  });
  await prisma.zone.deleteMany({
    where: {
      nom: { in: presentationZones },
      equipements: { none: {} },
    },
  });
}

export async function wipePresentationData(
  prisma: PrismaClient,
  options: { removeUploads?: boolean } = {},
) {
  await prisma.$transaction(
    async (tx) => {
      await tx.equipement.deleteMany({
        where: {
          code: { in: presentationEquipmentCodes },
        },
      });
      await tx.user.deleteMany({
        where: {
          email: { in: presentationUserEmails },
        },
      });
    },
    { timeout: 30_000 },
  );

  await cleanupPresentationReferences(prisma);

  if (options.removeUploads !== false) {
    await removePresentationUploads();
  }
}

export async function wipeAllData(
  prisma: PrismaClient,
  options: { removeUploads?: boolean } = {},
) {
  await prisma.$transaction(
    async (tx) => {
      await tx.rapportPhoto.deleteMany();
      await tx.rapportMaintenance.deleteMany();
      await tx.task.deleteMany();
      await tx.planning.deleteMany();
      await tx.equipementPhoto.deleteMany();
      await tx.equipement.deleteMany();
      await tx.user.deleteMany();
      await tx.famille.deleteMany();
      await tx.zone.deleteMany();
      await tx.service.deleteMany();
    },
    { timeout: 30_000 },
  );

  if (options.removeUploads !== false) {
    await removeAllUploads();
  }
}
