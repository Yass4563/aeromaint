import { Role } from "@prisma/client";

import { apiError, requireSession } from "@/lib/api";
import { generateRapportPDF } from "@/lib/pdf";
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
      task: true,
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

  const buffer = await generateRapportPDF(id);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
