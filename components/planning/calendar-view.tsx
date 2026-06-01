import { formatDate } from "@/lib/utils";

interface CalendarPlanning {
  id: string;
  type: string;
  periodicite: string;
  nuit: boolean;
  equipement: {
    nom: string;
    service: { nom: string };
  };
  technicien: { prenom: string; nom: string } | null;
  tasks: Array<{ datePrevue: Date | string }>;
}

export function CalendarView({ items }: { items: CalendarPlanning[] }) {
  const upcoming = items
    .map((item) => ({
      id: item.id,
      type: item.type,
      periodicite: item.periodicite,
      nuit: item.nuit,
      equipement: item.equipement,
      technicien: item.technicien,
      datePrevue: item.tasks[0]?.datePrevue,
    }))
    .filter((item): item is typeof item & { datePrevue: Date | string } =>
      Boolean(item.datePrevue),
    )
    .sort(
      (a, b) =>
        new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime(),
    )
    .slice(0, 12);

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Prochaines interventions</h2>
          <p className="text-sm text-muted">Vue calendrier operationnelle des dates planifiees.</p>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
          {upcoming.length}
        </span>
      </div>
      {upcoming.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((item) => (
            <article key={`${item.id}-${formatDate(item.datePrevue)}`} className="rounded-2xl border border-border bg-white px-4 py-3">
              <p className="text-sm font-semibold text-primary">{formatDate(item.datePrevue)}</p>
              <p className="mt-2 font-semibold">{item.equipement.nom}</p>
              <p className="text-sm text-muted">{item.type.replaceAll("_", " ")} - {item.periodicite}</p>
              <p className="text-sm text-muted">
                {item.equipement.service.nom}
                {item.technicien ? ` - ${item.technicien.prenom} ${item.technicien.nom}` : " - Non assigne"}
                {item.nuit ? " - Nuit" : ""}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Aucune intervention planifiee dans la selection actuelle.</p>
      )}
    </div>
  );
}
