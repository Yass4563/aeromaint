import { EquipementStatut } from "@prisma/client";

import { apiError, apiOk, parseJsonBody, requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { UpdateEquipementSchema } from "@/lib/validations/equipment";

function optionalText(value?: string) {
  return value && value.trim() ? value.trim() : null;
}

async function getEquipment(id: string) {
  return prisma.equipement.findUnique({
    where: { id },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requirePermission("equipement:read");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const { id } = await params;
  const equipement = await prisma.equipement.findUnique({
    where: { id },
    include: {
      famille: true,
      zone: true,
      service: true,
      photos: {
        orderBy: { createdAt: "desc" },
      },
      plannings: {
        where: { actif: true },
        include: { technicien: true },
        orderBy: { dateDebut: "desc" },
      },
      tasks: {
        take: 10,
        orderBy: { datePrevue: "desc" },
        include: {
          planning: true,
          technicien: true,
          rapport: true,
        },
      },
    },
  });

  if (!equipement) {
    return apiError("Equipement introuvable.", "EQUIPMENT_NOT_FOUND", 404);
  }

  return apiOk(equipement);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requirePermission("equipement:write");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const bodyResult = await parseJsonBody(request, UpdateEquipementSchema);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const { id } = await params;
  const existing = await getEquipment(id);

  if (!existing) {
    return apiError("Equipement introuvable.", "EQUIPMENT_NOT_FOUND", 404);
  }

  const statut = bodyResult.data.statut ?? existing.statut;
  const dateArret =
    statut === EquipementStatut.EN_SERVICE
      ? null
      : bodyResult.data.dateArret ?? existing.dateArret ?? new Date();

  const equipement = await prisma.equipement.update({
    where: { id },
    data: {
      nom: bodyResult.data.nom,
      code: optionalText(bodyResult.data.code),
      marque: optionalText(bodyResult.data.marque),
      numeroSerie: optionalText(bodyResult.data.numeroSerie),
      familleId: bodyResult.data.familleId,
      zoneId: bodyResult.data.zoneId,
      serviceId: bodyResult.data.serviceId,
      statut,
      qrAppose: bodyResult.data.qrAppose,
      miseEnService: bodyResult.data.miseEnService,
      remplacementPrevu: bodyResult.data.remplacementPrevu,
      dateArret,
      prixAcquisition: bodyResult.data.prixAcquisition,
      modeIntegre: bodyResult.data.modeIntegre,
      remarques: optionalText(bodyResult.data.remarques),
    },
    include: {
      famille: true,
      zone: true,
      service: true,
    },
  });

  return apiOk(equipement);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requirePermission("equipement:delete");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const { id } = await params;
  const existing = await getEquipment(id);

  if (!existing) {
    return apiError("Equipement introuvable.", "EQUIPMENT_NOT_FOUND", 404);
  }

  const equipement = await prisma.equipement.update({
    where: { id },
    data: { statut: EquipementStatut.HORS_SERVICE },
    include: {
      famille: true,
      zone: true,
      service: true,
    },
  });

  return apiOk(equipement);
}
