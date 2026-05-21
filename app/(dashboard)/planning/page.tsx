import { Role } from "@prisma/client";

import { CalendarView } from "@/components/planning/calendar-view";
import { PlanningModal } from "@/components/planning/planning-modal";
import { PlanningTable } from "@/components/planning/planning-table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseDate(value: string | string[] | undefined) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = (await searchParams) || {};
  const dateDebutParam = typeof params.dateDebut === "string" ? params.dateDebut : undefined;
  const dateFinParam = typeof params.dateFin === "string" ? params.dateFin : undefined;
  const serviceId = typeof params.serviceId === "string" ? params.serviceId : undefined;
  const familleId = typeof params.familleId === "string" ? params.familleId : undefined;
  const equipement = typeof params.equipement === "string" ? params.equipement : undefined;
  const periodicite = typeof params.periodicite === "string" ? params.periodicite : undefined;
  const type = typeof params.type === "string" ? params.type : undefined;
  const actif = typeof params.actif === "string" ? params.actif === "true" : undefined;
  const nuit = typeof params.nuit === "string" ? params.nuit === "true" : undefined;
  const dateDebut = parseDate(params.dateDebut);
  const dateFin = parseDate(params.dateFin);

  const [planning, equipements, techniciens, services, familles] = await Promise.all([
    prisma.planning.findMany({
      where: {
        ...(periodicite ? { periodicite: periodicite as never } : {}),
        ...(type ? { type: type as never } : {}),
        ...(actif !== undefined ? { actif } : {}),
        ...(nuit !== undefined ? { nuit } : {}),
        ...(dateDebut || dateFin
          ? {
              dateDebut: {
                ...(dateDebut ? { gte: dateDebut } : {}),
                ...(dateFin ? { lte: dateFin } : {}),
              },
            }
          : {}),
        equipement: {
          ...(serviceId ? { serviceId } : {}),
          ...(familleId ? { familleId } : {}),
          ...(equipement
            ? {
                OR: [
                  { nom: { contains: equipement } },
                  { code: { contains: equipement } },
                ],
              }
            : {}),
        },
      },
      include: {
        equipement: {
          include: {
            famille: true,
            service: true,
          },
        },
        technicien: true,
        tasks: {
          take: 1,
          orderBy: { datePrevue: "asc" },
        },
      },
      orderBy: [{ actif: "desc" }, { dateDebut: "desc" }],
    }),
    prisma.equipement.findMany({ orderBy: { nom: "asc" } }),
    prisma.user.findMany({
      where: { role: Role.TECHNICIEN, actif: true },
      orderBy: [{ prenom: "asc" }, { nom: "asc" }],
    }),
    prisma.service.findMany({ orderBy: { nom: "asc" } }),
    prisma.famille.findMany({ orderBy: { nom: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Planification preventive</h1>
          <p className="mt-2 text-sm text-muted">
            Maintenance preventive ESU : {planning.length} planification(s) affichee(s).
          </p>
        </div>
        {session?.user.role !== Role.TECHNICIEN ? (
          <PlanningModal equipements={equipements} techniciens={techniciens} />
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card bg-gradient-to-br from-white to-primary-soft/40">
          <p className="text-sm text-muted">Plannings actifs</p>
          <p className="mt-3 text-3xl font-black">{planning.filter((item) => item.actif).length}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-slate-100">
          <p className="text-sm text-muted">Interventions de nuit</p>
          <p className="mt-3 text-3xl font-black">{planning.filter((item) => item.nuit).length}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-amber-50">
          <p className="text-sm text-muted">Techniciens assignes</p>
          <p className="mt-3 text-3xl font-black">{planning.filter((item) => item.technicienId).length}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-teal-50">
          <p className="text-sm text-muted">Equipements planifies</p>
          <p className="mt-3 text-3xl font-black">{new Set(planning.map((item) => item.equipementId)).size}</p>
        </div>
      </div>

      <form className="card space-y-4">
        <div>
          <h2 className="text-lg font-bold">Maintenance preventive : planification</h2>
          <p className="text-sm text-muted">Duplique la logique de filtrage du planning operationnel.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <label className="space-y-2 text-sm font-medium">
            <span>Du</span>
            <input
              type="date"
              name="dateDebut"
              defaultValue={dateDebutParam}
              className="w-full rounded-xl border border-border px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Service</span>
            <select name="serviceId" defaultValue={serviceId} className="w-full rounded-xl border border-border px-4 py-3">
              <option value="">Tous les services</option>
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Familles d&apos;equipements</span>
            <select name="familleId" defaultValue={familleId} className="w-full rounded-xl border border-border px-4 py-3">
              <option value="">Toutes les familles</option>
              {familles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Nature maintenance</span>
            <select name="type" defaultValue={type} className="w-full rounded-xl border border-border px-4 py-3">
              <option value="">Toutes</option>
              <option value="ENTRETIEN">Entretien</option>
              <option value="ETALONNAGE">Etalonnage</option>
              <option value="CONTROLES_REGLEMENTAIRES">Controles reglementaires</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Etat</span>
            <select name="actif" defaultValue={typeof params.actif === "string" ? params.actif : ""} className="w-full rounded-xl border border-border px-4 py-3">
              <option value="">Tous</option>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <label className="space-y-2 text-sm font-medium">
            <span>Au</span>
            <input
              type="date"
              name="dateFin"
              defaultValue={dateFinParam}
              className="w-full rounded-xl border border-border px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Equipement</span>
            <input
              type="text"
              name="equipement"
              defaultValue={equipement}
              placeholder="Nom ou code"
              className="w-full rounded-xl border border-border px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            <span>Periodicite</span>
            <select name="periodicite" defaultValue={periodicite} className="w-full rounded-xl border border-border px-4 py-3">
              <option value="">Toutes</option>
              <option value="HEBDOMADAIRE">Hebdomadaire</option>
              <option value="MENSUELLE">Mensuelle</option>
              <option value="TRIMESTRIELLE">Trimestrielle</option>
              <option value="SEMESTRIELLE">Semestrielle</option>
              <option value="ANNUELLE">Annuelle</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium md:col-span-2 md:mt-8">
            <input type="checkbox" name="nuit" value="true" defaultChecked={nuit} />
            A realiser la nuit
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl bg-primary px-4 py-3 font-medium text-white">Chercher</button>
          <a href="/planning" className="rounded-xl border border-border px-4 py-3 font-medium">
            Reinitialiser
          </a>
        </div>
      </form>

      <PlanningTable items={planning} />
      <CalendarView />
    </div>
  );
}
