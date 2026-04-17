import { apiError, requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { generateQRCodeBuffer } from "@/lib/qr";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requirePermission("qr:generate");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const { id } = await params;
  const equipement = await prisma.equipement.findUnique({
    where: { id },
  });

  if (!equipement) {
    return apiError("Equipement introuvable.", "EQUIPMENT_NOT_FOUND", 404);
  }

  const buffer = await generateQRCodeBuffer(
    equipement.qrCode,
    process.env.NEXTAUTH_URL || "http://localhost:3000",
  );

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="qr-${equipement.id}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
