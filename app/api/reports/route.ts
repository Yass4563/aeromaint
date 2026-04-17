import { Role, TaskStatut } from "@prisma/client";

import { apiError, apiOk, parseJsonBody, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { ReportSchema } from "@/lib/validations/report";

export async function POST(request: Request) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  if (sessionResult.session.user.role !== Role.TECHNICIEN) {
    return apiError("Seuls les techniciens peuvent soumettre un rapport.", "FORBIDDEN", 403);
  }

  const bodyResult = await parseJsonBody(request, ReportSchema);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const task = await prisma.task.findUnique({
    where: { id: bodyResult.data.taskId },
    include: { rapport: true },
  });

  if (!task) {
    return apiError("Tache introuvable.", "TASK_NOT_FOUND", 404);
  }

  if (task.technicienId !== sessionResult.session.user.id) {
    return apiError("Vous ne pouvez soumettre qu'un rapport sur vos propres taches.", "FORBIDDEN", 403);
  }

  if (
    task.statut !== TaskStatut.OUVERTE &&
    task.statut !== TaskStatut.SOUMISE &&
    task.statut !== TaskStatut.REJETEE
  ) {
    return apiError("Cette tache ne peut plus recevoir de rapport.", "INVALID_TRANSITION", 400);
  }

  const report = await prisma.$transaction(async (tx) => {
    const saved = await tx.rapportMaintenance.upsert({
      where: { taskId: bodyResult.data.taskId },
      update: {
        description: bodyResult.data.description,
        dateIntervention: bodyResult.data.dateIntervention,
        soumisParId: sessionResult.session.user.id,
      },
      create: {
        taskId: bodyResult.data.taskId,
        description: bodyResult.data.description,
        dateIntervention: bodyResult.data.dateIntervention,
        soumisParId: sessionResult.session.user.id,
      },
    });

    await tx.rapportPhoto.deleteMany({
      where: { rapportId: saved.id },
    });

    if (bodyResult.data.photoUrls.length > 0) {
      await tx.rapportPhoto.createMany({
        data: bodyResult.data.photoUrls.map((url) => ({
          rapportId: saved.id,
          url,
        })),
      });
    }

    await tx.task.update({
      where: { id: bodyResult.data.taskId },
      data: {
        statut: TaskStatut.SOUMISE,
        soumisLe: new Date(),
      },
    });

    return tx.rapportMaintenance.findUnique({
      where: { id: saved.id },
      include: {
        photos: true,
        task: {
          include: {
            equipement: true,
            planning: true,
          },
        },
        soumisPar: true,
      },
    });
  });

  return apiOk(report, { status: 201 });
}
