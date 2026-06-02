import { EquipementStatut, Prisma } from "@prisma/client";

import { getSearchParams, requirePermission } from "@/lib/api";
import { generateEquipmentWorkbook } from "@/lib/equipment-export";
import { prisma } from "@/lib/prisma";

function buildEquipmentFilter(searchParams: URLSearchParams): Prisma.EquipementWhereInput {
  const search = searchParams.get("search")?.trim();
  const familleId = searchParams.get("familleId") || undefined;
  const zoneId = searchParams.get("zoneId") || undefined;
  const serviceId = searchParams.get("serviceId") || undefined;
  const enService = searchParams.get("enService") === "true";
  const statut = searchParams.get("statut") as EquipementStatut | null;

  return {
    ...(search
      ? {
          OR: [{ nom: { contains: search } }, { code: { contains: search } }],
        }
      : {}),
    ...(familleId ? { familleId } : {}),
    ...(zoneId ? { zoneId } : {}),
    ...(serviceId ? { serviceId } : {}),
    ...(enService ? { statut: EquipementStatut.EN_SERVICE } : {}),
    ...(!enService && statut ? { statut } : {}),
  };
}

export async function GET(request: Request) {
  const sessionResult = await requirePermission("equipement:read");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const searchParams = getSearchParams(request);
  const equipements = await prisma.equipement.findMany({
    where: buildEquipmentFilter(searchParams),
    include: {
      famille: true,
      zone: true,
      service: true,
    },
    orderBy: [{ nom: "asc" }],
  });

  const buffer = await generateEquipmentWorkbook(equipements);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="equipements.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
