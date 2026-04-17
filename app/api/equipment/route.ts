import { randomUUID } from "crypto";

import { EquipementStatut, Prisma } from "@prisma/client";

import {
  apiOk,
  getSearchParams,
  parseJsonBody,
  parsePositiveInt,
  requirePermission,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { CreateEquipementSchema } from "@/lib/validations/equipment";

function optionalText(value?: string) {
  return value && value.trim() ? value.trim() : null;
}

export async function GET(request: Request) {
  const sessionResult = await requirePermission("equipement:read");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const searchParams = getSearchParams(request as Request & { url: string });
  const search = searchParams.get("search")?.trim();
  const familleId = searchParams.get("familleId") || undefined;
  const zoneId = searchParams.get("zoneId") || undefined;
  const serviceId = searchParams.get("serviceId") || undefined;
  const statut = searchParams.get("statut") as EquipementStatut | null;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), 20, 100);

  const where: Prisma.EquipementWhereInput = {
    ...(search
      ? {
          OR: [
            { nom: { contains: search } },
            { code: { contains: search } },
          ],
        }
      : {}),
    ...(familleId ? { familleId } : {}),
    ...(zoneId ? { zoneId } : {}),
    ...(serviceId ? { serviceId } : {}),
    ...(statut ? { statut } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.equipement.findMany({
      where,
      include: {
        famille: true,
        zone: true,
        service: true,
      },
      orderBy: [{ nom: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.equipement.count({ where }),
  ]);

  return apiOk({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: Request) {
  const sessionResult = await requirePermission("equipement:write");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const bodyResult = await parseJsonBody(request, CreateEquipementSchema);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const equipement = await prisma.equipement.create({
    data: {
      nom: bodyResult.data.nom,
      code: optionalText(bodyResult.data.code),
      marque: optionalText(bodyResult.data.marque),
      numeroSerie: optionalText(bodyResult.data.numeroSerie),
      familleId: bodyResult.data.familleId,
      zoneId: bodyResult.data.zoneId,
      serviceId: bodyResult.data.serviceId,
      statut: bodyResult.data.statut,
      qrCode: randomUUID(),
      qrAppose: bodyResult.data.qrAppose ?? false,
      miseEnService: bodyResult.data.miseEnService,
      remplacementPrevu: bodyResult.data.remplacementPrevu,
      dateArret: bodyResult.data.dateArret,
      prixAcquisition: bodyResult.data.prixAcquisition,
      modeIntegre: bodyResult.data.modeIntegre ?? false,
      remarques: optionalText(bodyResult.data.remarques),
    },
    include: {
      famille: true,
      zone: true,
      service: true,
    },
  });

  return apiOk(equipement, { status: 201 });
}
