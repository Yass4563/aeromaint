import { Role } from "@prisma/client";

import { apiError, apiOk, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const { id } = await params;
  const report = await prisma.rapportMaintenance.findUnique({
    where: { id },
    include: {
      photos: true,
      soumisPar: true,
      task: {
        include: {
          planning: true,
          equipement: {
            include: {
              famille: true,
              zone: true,
              service: true,
            },
          },
        },
      },
    },
  });

  if (!report) {
    return apiError("Rapport introuvable.", "REPORT_NOT_FOUND", 404);
  }

  if (
    sessionResult.session.user.role === Role.TECHNICIEN &&
    report.task.technicienId !== sessionResult.session.user.id
  ) {
    return apiError("Vous n'avez pas les droits necessaires.", "FORBIDDEN", 403);
  }

  return apiOk(report);
}
