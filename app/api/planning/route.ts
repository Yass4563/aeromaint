import { Prisma } from "@prisma/client";

import {
  apiOk,
  getSearchParams,
  parseBoolean,
  parseJsonBody,
  requirePermission,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { generateTasksForPlanning } from "@/lib/task-generator";
import { PlanningSchema } from "@/lib/validations/planning";

export async function GET(request: Request) {
  const sessionResult = await requirePermission("planning:read");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const searchParams = getSearchParams(request as Request & { url: string });
  const equipementId = searchParams.get("equipementId") || undefined;
  const technicienId = searchParams.get("technicienId") || undefined;
  const type = searchParams.get("type") || undefined;
  const periodicite = searchParams.get("periodicite") || undefined;
  const actif = parseBoolean(searchParams.get("actif"));

  const where: Prisma.PlanningWhereInput = {
    ...(equipementId ? { equipementId } : {}),
    ...(technicienId ? { technicienId } : {}),
    ...(type ? { type: type as Prisma.EnumMaintenanceTypeFilter["equals"] } : {}),
    ...(periodicite
      ? { periodicite: periodicite as Prisma.EnumPeriodiciteFilter["equals"] }
      : {}),
    ...(actif !== undefined ? { actif } : {}),
  };

  const planning = await prisma.planning.findMany({
    where,
    include: {
      equipement: {
        include: {
          famille: true,
          zone: true,
          service: true,
        },
      },
      technicien: true,
      tasks: {
        take: 1,
        orderBy: { datePrevue: "asc" },
      },
    },
    orderBy: { dateDebut: "desc" },
  });

  return apiOk(planning);
}

export async function POST(request: Request) {
  const sessionResult = await requirePermission("planning:write");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const bodyResult = await parseJsonBody(request, PlanningSchema);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const planning = await prisma.planning.create({
    data: {
      ...bodyResult.data,
      technicienId: bodyResult.data.technicienId || null,
      eviterWeekend: bodyResult.data.eviterWeekend ?? false,
      nuit: bodyResult.data.nuit ?? false,
      actif: bodyResult.data.actif ?? true,
    },
    include: {
      equipement: true,
      technicien: true,
    },
  });

  await generateTasksForPlanning(planning.id);
  return apiOk(planning, { status: 201 });
}
