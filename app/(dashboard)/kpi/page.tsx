import { endOfMonth, startOfMonth } from "date-fns";
import { Role } from "@prisma/client";

import { KPIDashboard } from "@/components/kpi/kpi-dashboard";
import { KPIFilters } from "@/components/kpi/kpi-filters";
import { auth } from "@/lib/auth";
import { calculateKPI } from "@/lib/kpi";
import { prisma } from "@/lib/prisma";

export default async function KPIPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = (await searchParams) || {};
  const initialDateDebut =
    typeof params.dateDebut === "string"
      ? params.dateDebut
      : startOfMonth(new Date()).toISOString().slice(0, 10);
  const initialDateFin =
    typeof params.dateFin === "string"
      ? params.dateFin
      : endOfMonth(new Date()).toISOString().slice(0, 10);

  const [families, services, result] = await Promise.all([
    prisma.famille.findMany({ orderBy: { nom: "asc" } }),
    prisma.service.findMany({ orderBy: { nom: "asc" } }),
    calculateKPI({
      dateDebut: new Date(initialDateDebut),
      dateFin: new Date(initialDateFin),
      serviceId: typeof params.serviceId === "string" ? params.serviceId : undefined,
      familleId: typeof params.familleId === "string" ? params.familleId : undefined,
      technicienId:
        session?.user.role === Role.TECHNICIEN
          ? session.user.id
          : typeof params.technicienId === "string"
            ? params.technicienId
            : undefined,
      equipementId: typeof params.equipementId === "string" ? params.equipementId : undefined,
      periodicite: typeof params.periodicite === "string" ? (params.periodicite as never) : undefined,
      type: typeof params.type === "string" ? (params.type as never) : undefined,
      nuit: params.nuit === "true" ? true : undefined,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="card bg-[linear-gradient(135deg,rgba(27,79,216,0.08),rgba(15,110,86,0.05))]">
        <h1 className="text-3xl font-black tracking-tight">
          Maintenance preventive : Indicateurs
        </h1>
        <p className="mt-2 text-sm text-muted">
          Indicateurs TRP calcules sur la periode et les filtres selectionnes.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white px-4 py-2 text-muted ring-1 ring-border">
            Du {initialDateDebut}
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-muted ring-1 ring-border">
            Au {initialDateFin}
          </span>
        </div>
      </div>
      <KPIFilters
        families={families}
        services={services}
        initial={{
          dateDebut: initialDateDebut,
          dateFin: initialDateFin,
          serviceId: typeof params.serviceId === "string" ? params.serviceId : undefined,
          familleId: typeof params.familleId === "string" ? params.familleId : undefined,
          type: typeof params.type === "string" ? params.type : undefined,
          periodicite: typeof params.periodicite === "string" ? params.periodicite : undefined,
          equipementId: typeof params.equipementId === "string" ? params.equipementId : undefined,
          nuit: typeof params.nuit === "string" ? params.nuit : undefined,
        }}
      />
      <KPIDashboard result={result} />
    </div>
  );
}
