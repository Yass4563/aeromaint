import { TaskStatut } from "@prisma/client";

import { apiError, apiOk, parseJsonBody, requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { generateTasksForPlanning } from "@/lib/task-generator";
import { PlanningUpdateSchema } from "@/lib/validations/planning";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requirePermission("planning:read");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const { id } = await params;
  const planning = await prisma.planning.findUnique({
    where: { id },
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
        orderBy: { datePrevue: "asc" },
        include: { rapport: true },
      },
    },
  });

  if (!planning) {
    return apiError("Planning introuvable.", "PLANNING_NOT_FOUND", 404);
  }

  return apiOk(planning);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requirePermission("planning:write");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const bodyResult = await parseJsonBody(request, PlanningUpdateSchema);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const { id } = await params;
  const existing = await prisma.planning.findUnique({
    where: { id },
  });

  if (!existing) {
    return apiError("Planning introuvable.", "PLANNING_NOT_FOUND", 404);
  }

  const planning = await prisma.planning.update({
    where: { id },
    data: {
      ...bodyResult.data,
      technicienId:
        bodyResult.data.technicienId === undefined
          ? undefined
          : bodyResult.data.technicienId || null,
    },
    include: {
      equipement: true,
      technicien: true,
    },
  });

  await generateTasksForPlanning(planning.id);
  return apiOk(planning);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requirePermission("planning:delete");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const { id } = await params;
  const existing = await prisma.planning.findUnique({
    where: { id },
  });

  if (!existing) {
    return apiError("Planning introuvable.", "PLANNING_NOT_FOUND", 404);
  }

  await prisma.task.deleteMany({
    where: {
      planningId: id,
      statut: TaskStatut.OUVERTE,
      datePrevue: {
        gte: new Date(),
      },
    },
  });

  const planning = await prisma.planning.update({
    where: { id },
    data: { actif: false },
  });

  return apiOk(planning);
}
