import { Periodicite } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Option {
  id: string;
  nom: string;
}

export function KPIFilters({
  families,
  services,
  initial,
}: {
  families: Option[];
  services: Option[];
  initial: Record<string, string | undefined>;
}) {
  return (
    <form className="card space-y-4">
      <div className="grid gap-4 md:grid-cols-5">
        <Input label="Du" name="dateDebut" type="date" defaultValue={initial.dateDebut} />
        <Select label="Service" name="serviceId" defaultValue={initial.serviceId}>
          <option value="">Tous les services</option>
          {services.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
        </Select>
        <Select label="Familles d'equipements" name="familleId" defaultValue={initial.familleId}>
          <option value="">Toutes les familles</option>
          {families.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
        </Select>
        <Select label="Nature maintenance" name="type" defaultValue={initial.type}>
          <option value="">Tous les types</option>
          <option value="ENTRETIEN">Entretien</option>
          <option value="ETALONNAGE">Etalonnage</option>
          <option value="CONTROLES_REGLEMENTAIRES">Controles reglementaires</option>
        </Select>
        <div className="rounded-2xl border border-border bg-primary-soft/40 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted">Etat</p>
          <p className="mt-2 text-sm font-medium text-foreground">Planifie sur la periode</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <Input label="Au" name="dateFin" type="date" defaultValue={initial.dateFin} />
        <Select label="Tous les services" name="serviceScope" defaultValue="">
          <option value="">Tous les services</option>
          {services.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
        </Select>
        <Input
          label="Equipement"
          name="equipementId"
          defaultValue={initial.equipementId}
          placeholder="ID equipement"
        />
        <Select label="Periodicite" name="periodicite" defaultValue={initial.periodicite}>
          <option value="">Toutes</option>
          {Object.values(Periodicite).map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <label className="flex items-end gap-3 pb-3 text-sm font-medium">
          <input type="checkbox" name="nuit" value="true" defaultChecked={initial.nuit === "true"} />
          a realiser la nuit
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Calculer</Button>
        <a
          href="/kpi"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-surface px-4 text-sm font-medium text-foreground ring-1 ring-border transition hover:bg-primary-soft"
        >
          Reinitialiser
        </a>
        <div className="inline-flex items-center rounded-xl bg-primary-soft px-4 text-sm font-medium text-foreground">
          Ecran TRP
        </div>
      </div>
    </form>
  );
}
