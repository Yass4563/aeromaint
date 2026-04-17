import { Role } from "@prisma/client";

import { EquipmentModal } from "@/components/equipment/equipment-modal";
import { EquipmentTable } from "@/components/equipment/equipment-table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const [families, zones, services, items] = await Promise.all([
    prisma.famille.findMany({ orderBy: { nom: "asc" } }),
    prisma.zone.findMany({ orderBy: { nom: "asc" } }),
    prisma.service.findMany({ orderBy: { nom: "asc" } }),
    prisma.equipement.findMany({
      where: {
        ...(search
          ? {
              OR: [{ nom: { contains: search } }, { code: { contains: search } }],
            }
          : {}),
        ...(familleId ? { familleId } : {}),
        ...(zoneId ? { zoneId } : {}),
        ...(serviceId ? { serviceId } : {}),
        ...(enService ? { statut: "EN_SERVICE" as never } : {}),
        ...(!enService && statut ? { statut: statut as never } : {}),
      },
      include: {
        famille: true,
        zone: true,
        service: true,
      },
      orderBy: { nom: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Parc des equipements</h1>
          <p className="mt-2 text-sm text-muted">Liste des equipements : {items.length}</p>
        </div>
        {session?.user.role === Role.ADMIN ? (
          <EquipmentModal triggerLabel="+ Ajouter" familles={families} zones={zones} services={services} />
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card bg-gradient-to-br from-white to-primary-soft/40">
          <p className="text-sm text-muted">En service</p>
          <p className="mt-3 text-3xl font-black">{items.filter((item) => item.statut === "EN_SERVICE").length}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-red-50">
          <p className="text-sm text-muted">En panne</p>
          <p className="mt-3 text-3xl font-black">{items.filter((item) => item.statut === "EN_PANNE").length}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-slate-100">
          <p className="text-sm text-muted">Hors service</p>
          <p className="mt-3 text-3xl font-black">{items.filter((item) => item.statut === "HORS_SERVICE").length}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-amber-50">
          <p className="text-sm text-muted">Services couverts</p>
          <p className="mt-3 text-3xl font-black">{new Set(items.map((item) => item.service.nom)).size}</p>
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
            {services.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
          </select>
          <select name="familleId" defaultValue={familleId} className="rounded-xl border border-border px-4 py-3">
            <option value="">Toutes les familles</option>
            {families.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
          </select>
          <select name="zoneId" defaultValue={zoneId} className="rounded-xl border border-border px-4 py-3">
            <option value="">Toutes les zones</option>
            {zones.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
          </select>
          <select name="statut" defaultValue={statut} className="rounded-xl border border-border px-4 py-3" disabled={enService}>
            <option value="">Tous les statuts</option>
            <option value="EN_SERVICE">En service</option>
            <option value="HORS_SERVICE">Hors service</option>
            <option value="EN_PANNE">En panne</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button className="rounded-xl bg-primary px-4 py-3 font-medium text-white">Chercher</button>
          <a href="/equipment" className="rounded-xl border border-border px-4 py-3 font-medium">
            Reinitialiser
          </a>
        </div>
      </form>

      <EquipmentTable items={items} />
    </div>
  );
}
