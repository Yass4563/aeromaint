import { Role } from "@prisma/client";

import { CalendarView } from "@/components/planning/calendar-view";
import { PlanningModal } from "@/components/planning/planning-modal";
import { PlanningTable } from "@/components/planning/planning-table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = (await searchParams) || {};
  const equipementId = typeof params.equipementId === "string" ? params.equipementId : undefined;
  const technicienId = typeof params.technicienId === "string" ? params.technicienId : undefined;
  const periodicite = typeof params.periodicite === "string" ? params.periodicite : undefined;
  const type = typeof params.type === "string" ? params.type : undefined;
  const actif = typeof params.actif === "string" ? params.actif === "true" : undefined;
  const nuit = typeof params.nuit === "string" ? params.nuit === "true" : undefined;

  const [planning, equipements, techniciens] = await Promise.all([
    prisma.planning.findMany({
      where: {
        ...(equipementId ? { equipementId } : {}),
        ...(technicienId ? { technicienId } : {}),
        ...(periodicite ? { periodicite: periodicite as never } : {}),
        ...(type ? { type: type as never } : {}),
        ...(actif !== undefined ? { actif } : {}),
        ...(nuit !== undefined ? { nuit } : {}),
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
      orderBy: { dateDebut: "desc" },
    }),
    prisma.equipement.findMany({ orderBy: { nom: "asc" } }),
    prisma.user.findMany({
      where: { role: Role.TECHNICIEN, actif: true },
      orderBy: [{ prenom: "asc" }, { nom: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Planification preventive</h1>
          <p className="mt-2 text-sm text-muted">Pilotage des interventions recurrentes.</p>
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
      <form className="card grid gap-4 md:grid-cols-5">
        <select name="equipementId" defaultValue={equipementId} className="rounded-xl border border-border px-4 py-3">
          <option value="">Tous les equipements</option>
          {equipements.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
        </select>
        <select name="technicienId" defaultValue={technicienId} className="rounded-xl border border-border px-4 py-3">
          <option value="">Tous les techniciens</option>
          {techniciens.map((item) => <option key={item.id} value={item.id}>{item.prenom} {item.nom}</option>)}
        </select>
        <select name="type" defaultValue={type} className="rounded-xl border border-border px-4 py-3">
          <option value="">Nature maintenance</option>
          <option value="ENTRETIEN">Entretien</option>
          <option value="ETALONNAGE">Etalonnage</option>
          <option value="CONTROLES_REGLEMENTAIRES">Controles reglementaires</option>
        </select>
        <select name="periodicite" defaultValue={periodicite} className="rounded-xl border border-border px-4 py-3">
          <option value="">Periodicite</option>
          <option value="HEBDOMADAIRE">Hebdomadaire</option>
          <option value="MENSUELLE">Mensuelle</option>
          <option value="TRIMESTRIELLE">Trimestrielle</option>
          <option value="SEMESTRIELLE">Semestrielle</option>
          <option value="ANNUELLE">Annuelle</option>
        </select>
        <select name="actif" defaultValue={typeof params.actif === "string" ? params.actif : ""} className="rounded-xl border border-border px-4 py-3">
          <option value="">Etat</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
        <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium">
          <input type="checkbox" name="nuit" value="true" defaultChecked={nuit} />
          a realiser la nuit
        </label>
        <div className="md:col-span-4 flex flex-wrap gap-3">
          <button className="rounded-xl bg-primary px-4 py-3 font-medium text-white">Chercher</button>
          <a href="/planning" className="rounded-xl border border-border px-4 py-3 font-medium">
            Reinitialiser
          </a>
        </div>
      </form>
      <CalendarView />
      <PlanningTable items={planning} />
    </div>
  );
}
