import { Role, TaskStatut } from "@prisma/client";

import { apiError, apiOk, parseJsonBody, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { TaskRejectionSchema } from "@/lib/validations/task";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  if (
    sessionResult.session.user.role !== Role.ADMIN &&
    sessionResult.session.user.role !== Role.SUPERVISEUR
  ) {
    return apiError("Vous n'avez pas les droits necessaires.", "FORBIDDEN", 403);
  }

  const bodyResult = await parseJsonBody(request, TaskRejectionSchema);

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

  if (task.statut !== TaskStatut.SOUMISE) {
    return apiError("La tache doit etre soumise avant rejet.", "INVALID_TRANSITION", 400);
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      statut: TaskStatut.REJETEE,
      rejeteLe: new Date(),
      rejeteParId: sessionResult.session.user.id,
      commentaireValidation: bodyResult.data.commentaire,
    },
    include: {
      equipement: true,
      planning: true,
      rejetePar: true,
    },
  });

  return apiOk(updated);
}
