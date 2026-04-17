import { randomUUID } from "crypto";

import { EquipementStatut } from "@prisma/client";
import { parse } from "csv-parse/sync";

import { apiError, apiOk, requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const statusMap: Record<string, EquipementStatut> = {
  en_service: EquipementStatut.EN_SERVICE,
  hors_service: EquipementStatut.HORS_SERVICE,
  en_panne: EquipementStatut.EN_PANNE,
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  const sessionResult = await requirePermission("equipement:write");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return apiError("Le fichier CSV est obligatoire.", "CSV_REQUIRED", 400);
  }

  const content = Buffer.from(await file.arrayBuffer()).toString("utf-8");
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const families = await prisma.famille.findMany();
  const zones = await prisma.zone.findMany();
  const services = await prisma.service.findMany();
  const familyMap = new Map(families.map((item) => [normalizeKey(item.nom), item.id]));
  const zoneMap = new Map(zones.map((item) => [normalizeKey(item.nom), item.id]));
  const serviceMap = new Map(services.map((item) => [normalizeKey(item.nom), item.id]));

  const errors: Array<{ ligne: number; erreur: string }> = [];
  let inserted = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const familleId = familyMap.get(normalizeKey(row.famille || ""));
    const zoneId = zoneMap.get(normalizeKey(row.zone || ""));
    const serviceId = serviceMap.get(normalizeKey(row.service || ""));

    if (!row.nom || !familleId || !zoneId || !serviceId) {
      errors.push({
        ligne: index + 2,
        erreur: "Famille, zone, service ou nom introuvable.",
      });
      continue;
    }

    try {
      await prisma.equipement.create({
        data: {
          nom: row.nom,
          code: row.code || null,
          marque: row.marque || null,
          numeroSerie: row.numeroSerie || null,
          familleId,
          zoneId,
          serviceId,
          statut:
            statusMap[normalizeKey((row.statut || "EN_SERVICE").replace(/\s+/g, "_"))] ||
            EquipementStatut.EN_SERVICE,
          qrCode: randomUUID(),
          remarques: row.remarques || null,
        },
      });
      inserted += 1;
    } catch (error) {
      errors.push({
        ligne: index + 2,
        erreur:
          error instanceof Error
            ? error.message
            : "Impossible d'importer cette ligne.",
      });
    }
  }

  return apiOk({ inserted, errors });
}
