import { Role } from "@prisma/client";

import { apiError, apiOk, getSearchParams, parseBoolean, requireSession } from "@/lib/api";
import { calculateKPI } from "@/lib/kpi";

export async function GET(request: Request) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const params = getSearchParams(request as Request & { url: string });
  const dateDebut = params.get("dateDebut");
  const dateFin = params.get("dateFin");

  if (!dateDebut || !dateFin) {
    return apiError("Les dates de debut et de fin sont obligatoires.", "MISSING_DATES", 400);
  }

  const technicienId =
    sessionResult.session.user.role === Role.TECHNICIEN
      ? sessionResult.session.user.id
      : params.get("technicienId") || undefined;

  const result = await calculateKPI({
    dateDebut: new Date(dateDebut),
    dateFin: new Date(dateFin),
    serviceId: params.get("serviceId") || undefined,
    familleId: params.get("familleId") || undefined,
    technicienId,
    equipementId: params.get("equipementId") || undefined,
    periodicite: (params.get("periodicite") as never) || undefined,
    type: (params.get("type") as never) || undefined,
    nuit: parseBoolean(params.get("nuit")),
  });

  return apiOk(result);
}
