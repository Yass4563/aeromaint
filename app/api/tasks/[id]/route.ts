import { Role, TaskStatut } from "@prisma/client";

import { apiError, apiOk, parseJsonBody, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { TaskUpdateSchema } from "@/lib/validations/task";

async function findTask(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      equipement: {
        include: {
          famille: true,
          zone: true,
          service: true,
          photos: true,
        },
      },
      planning: true,
      technicien: true,
      validePar: true,
      rejetePar: true,
      rapport: {
        include: {
          photos: true,
          soumisPar: true,
        },
      },
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const { id } = await params;
  const task = await findTask(id);

  if (!task) {
    return apiError("Tache introuvable.", "TASK_NOT_FOUND", 404);
  }

  if (
    sessionResult.session.user.role === Role.TECHNICIEN &&
    task.technicienId !== sessionResult.session.user.id
  ) {
    return apiError("Vous n'avez pas les droits necessaires.", "FORBIDDEN", 403);
  }

  return apiOk(task);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const bodyResult = await parseJsonBody(request, TaskUpdateSchema);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
  });

  if (!task) {
    return apiError("Tache introuvable.", "TASK_NOT_FOUND", 404);
  }

  const role = sessionResult.session.user.role;

  if (role === Role.TECHNICIEN) {
    if (task.technicienId !== sessionResult.session.user.id) {
      return apiError("Vous ne pouvez soumettre que vos propres taches.", "FORBIDDEN", 403);
    }

    if (bodyResult.data.statut !== TaskStatut.SOUMISE || task.statut !== TaskStatut.OUVERTE) {
      return apiError(
        "Seule la transition OUVERTE vers SOUMISE est autorisee.",
        "INVALID_TRANSITION",
        400,
      );
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        statut: TaskStatut.SOUMISE,
        soumisLe: new Date(),
      },
      include: {
        equipement: true,
        planning: true,
      },
    });

    return apiOk(updated);
  }

  if (role === Role.SUPERVISEUR || role === Role.ADMIN) {
    const updated = await prisma.task.update({
      where: { id },
      data: {
        technicienId:
          bodyResult.data.technicienId === undefined
            ? undefined
            : bodyResult.data.technicienId || null,
      },
      include: {
        equipement: true,
        planning: true,
        technicien: true,
      },
    });

    return apiOk(updated);
  }

  return apiError("Vous n'avez pas les droits necessaires.", "FORBIDDEN", 403);
}
