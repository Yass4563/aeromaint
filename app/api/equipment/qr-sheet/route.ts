import { EquipementStatut, Prisma } from "@prisma/client";

import { apiError, getSearchParams, parsePositiveInt, requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { generateQRSheet } from "@/lib/qr";

export async function GET(request: Request) {
  const sessionResult = await requirePermission("qr:generate");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const searchParams = getSearchParams(request as Request & { url: string });
  const search = searchParams.get("search")?.trim();
  const familleId = searchParams.get("familleId") || undefined;
  const zoneId = searchParams.get("zoneId") || undefined;
  const serviceId = searchParams.get("serviceId") || undefined;
  const statut = searchParams.get("statut") as EquipementStatut | null;
  const limit = parsePositiveInt(searchParams.get("limit"), 500, 1000);

  const where: Prisma.EquipementWhereInput = {
    ...(search
      ? {
          OR: [{ nom: { contains: search } }, { code: { contains: search } }],
        }
      : {}),
    ...(familleId ? { familleId } : {}),
    ...(zoneId ? { zoneId } : {}),
    ...(serviceId ? { serviceId } : {}),
    ...(statut ? { statut } : {}),
  };

  const equipements = await prisma.equipement.findMany({
    where,
    include: {
      zone: true,
    },
    orderBy: [{ zone: { nom: "asc" } }, { nom: "asc" }],
    take: limit,
  });

  if (equipements.length === 0) {
    return apiError("Aucun equipement disponible pour la feuille QR.", "NO_EQUIPMENT", 404);
  }

  const buffer = await generateQRSheet(
    equipements.map((equipement) => ({
      nom: equipement.nom,
      qrCode: equipement.qrCode,
      zone: equipement.zone?.nom,
    })),
    process.env.NEXTAUTH_URL || "http://localhost:3000",
  );

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="feuille-qr-equipements.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
