import { Role, TaskStatut } from "@prisma/client";

import { apiError, apiOk, parseJsonBody, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { TaskValidationSchema } from "@/lib/validations/task";

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

  const bodyResult = await parseJsonBody(request, TaskValidationSchema);

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
    return apiError("La tache doit etre soumise avant validation.", "INVALID_TRANSITION", 400);
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      statut: TaskStatut.VALIDEE,
      valideLe: new Date(),
      valideParId: sessionResult.session.user.id,
      commentaireValidation: bodyResult.data.commentaire || null,
    },
    include: {
      equipement: true,
      planning: true,
      validePar: true,
    },
  });

  return apiOk(updated);
}
