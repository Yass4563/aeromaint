import Link from "next/link";

import { Role } from "@prisma/client";

import { EquipmentModal } from "@/components/equipment/equipment-modal";
import { EquipmentTable } from "@/components/equipment/equipment-table";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

function toPositiveNumber(value: string | string[] | undefined, fallback: number) {
  const target = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(target) && target > 0 ? Math.floor(target) : fallback;
}

function buildQueryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  return search.toString();
}

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = (await searchParams) || {};
  const search = typeof params.search === "string" ? params.search : undefined;
  const familleId = typeof params.familleId === "string" ? params.familleId : undefined;
  const zoneId = typeof params.zoneId === "string" ? params.zoneId : undefined;
  const serviceId = typeof params.serviceId === "string" ? params.serviceId : undefined;
  const statut = typeof params.statut === "string" ? params.statut : undefined;
  const enService = params.enService === "true";
  const page = toPositiveNumber(params.page, 1);
  const limit = Math.min(toPositiveNumber(params.limit, 10), 50);

  const where = {
    ...(search
      ? {
          OR: [{ nom: { contains: search } }, { code: { contains: search } }],
        }
      : {}),
    ...(familleId ? { familleId } : {}),
    ...(zoneId ? { zoneId } : {}),
    ...(serviceId ? { serviceId } : {}),
    ...(enService ? { statut: "EN_SERVICE" as const } : {}),
    ...(!enService && statut ? { statut: statut as never } : {}),
  };

  const [
    families,
    zones,
    services,
    items,
    total,
    statusCounts,
    distinctServices,
  ] = await Promise.all([
    prisma.famille.findMany({ orderBy: { nom: "asc" } }),
    prisma.zone.findMany({ orderBy: { nom: "asc" } }),
    prisma.service.findMany({ orderBy: { nom: "asc" } }),
    prisma.equipement.findMany({
      where,
      include: {
        famille: true,
        zone: true,
        service: true,
      },
      orderBy: { nom: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.equipement.count({ where }),
    prisma.equipement.groupBy({
      by: ["statut"],
      where,
      _count: { _all: true },
    }),
    prisma.equipement.findMany({
      where,
      select: { serviceId: true },
      distinct: ["serviceId"],
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const pageEnd = Math.min(currentPage * limit, total);
  const countsByStatus = Object.fromEntries(
    statusCounts.map((entry) => [entry.statut, entry._count._all]),
  ) as Record<string, number>;
  const baseParams = {
    ...(search ? { search } : {}),
    ...(familleId ? { familleId } : {}),
    ...(zoneId ? { zoneId } : {}),
    ...(serviceId ? { serviceId } : {}),
    ...(statut ? { statut } : {}),
    ...(enService ? { enService: "true" } : {}),
    limit: String(limit),
  };
  const paginationPages = Array.from(
    new Set(
      [1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter(
        (value) => value >= 1 && value <= totalPages,
      ),
    ),
  );
  const canEditEquipment =
    session?.user?.role && hasPermission(session.user.role, "equipement:write");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Parc des equipements</h1>
          <p className="mt-2 text-sm text-muted">Liste des equipements : {total}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {session?.user.role === Role.ADMIN ? (
            <>
              <Link
                href={`/api/equipment/qr-sheet?${buildQueryString(baseParams)}`}
                target="_blank"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-primary-soft"
              >
                Imprimer la feuille QR
              </Link>
              <EquipmentModal
                triggerLabel="+ Ajouter"
                familles={families}
                zones={zones}
                services={services}
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card bg-gradient-to-br from-white to-primary-soft/40">
          <p className="text-sm text-muted">En service</p>
          <p className="mt-3 text-3xl font-black">{countsByStatus.EN_SERVICE || 0}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-red-50">
          <p className="text-sm text-muted">En panne</p>
          <p className="mt-3 text-3xl font-black">{countsByStatus.EN_PANNE || 0}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-slate-100">
          <p className="text-sm text-muted">Hors service</p>
          <p className="mt-3 text-3xl font-black">{countsByStatus.HORS_SERVICE || 0}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-amber-50">
          <p className="text-sm text-muted">Services couverts</p>
          <p className="mt-3 text-3xl font-black">{distinctServices.length}</p>
        </div>
      </div>

      <form className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Recherche des equipements</h2>
            <p className="text-sm text-muted">Nom, code, service, famille, zone et statut.</p>
          </div>
          <label className="flex items-center gap-3 rounded-full bg-primary-soft px-4 py-2 text-sm font-medium">
            <input type="checkbox" name="enService" value="true" defaultChecked={enService} />
            En service
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          <input
            name="search"
            defaultValue={search}
            placeholder="Nom ou code"
            className="rounded-xl border border-border px-4 py-3"
          />
          <select name="serviceId" defaultValue={serviceId} className="rounded-xl border border-border px-4 py-3">
            <option value="">Tous les services</option>
            {services.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nom}
              </option>
            ))}
          </select>
          <select name="familleId" defaultValue={familleId} className="rounded-xl border border-border px-4 py-3">
            <option value="">Toutes les familles</option>
            {families.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nom}
              </option>
            ))}
          </select>
          <select name="zoneId" defaultValue={zoneId} className="rounded-xl border border-border px-4 py-3">
            <option value="">Toutes les zones</option>
            {zones.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nom}
              </option>
            ))}
          </select>
          <select
            name="statut"
            defaultValue={statut}
            className="rounded-xl border border-border px-4 py-3"
            disabled={enService}
          >
            <option value="">Tous les statuts</option>
            <option value="EN_SERVICE">En service</option>
            <option value="HORS_SERVICE">Hors service</option>
            <option value="EN_PANNE">En panne</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted">
            Lignes par page
            <select
              name="limit"
              defaultValue={String(limit)}
              className="ml-3 rounded-xl border border-border px-3 py-2 text-sm"
            >
              {[10, 20, 30, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-xl bg-primary px-4 py-3 font-medium text-white">Chercher</button>
          <a href="/equipment" className="rounded-xl border border-border px-4 py-3 font-medium">
            Reinitialiser
          </a>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Affichage de {pageStart} a {pageEnd} sur {total} equipements.
        </p>
        <div className="flex items-center gap-2">
          <a
            href={`/api/equipment/export?${buildQueryString(baseParams)}`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-primary-soft"
          >
            Exporter Excel
          </a>
          <Link
            href={`/equipment?${buildQueryString({ ...baseParams, page: String(Math.max(1, currentPage - 1)) })}`}
            aria-disabled={currentPage <= 1}
            className={
              currentPage <= 1
                ? "pointer-events-none inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold opacity-50"
                : "inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-primary-soft"
            }
          >
            Precedent
          </Link>
          {paginationPages.map((pageNumber) => (
            <Link
              key={pageNumber}
              href={`/equipment?${buildQueryString({ ...baseParams, page: String(pageNumber) })}`}
              className={
                pageNumber === currentPage
                  ? "inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-primary px-3 text-sm font-semibold text-white"
                  : "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-primary-soft"
              }
            >
              {pageNumber}
            </Link>
          ))}
          <Link
            href={`/equipment?${buildQueryString({ ...baseParams, page: String(Math.min(totalPages, currentPage + 1)) })}`}
            aria-disabled={currentPage >= totalPages}
            className={
              currentPage >= totalPages
                ? "pointer-events-none inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold opacity-50"
                : "inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-primary-soft"
            }
          >
            Suivant
          </Link>
        </div>
      </div>

      <EquipmentTable
        items={items}
        familles={families}
        zones={zones}
        services={services}
        canEdit={Boolean(canEditEquipment)}
      />
    </div>
  );
}
