import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface PlanningRow {
  id: string;
  type: string;
  periodicite: string;
  dateDebut: Date;
  nuit: boolean;
  actif: boolean;
  equipement: {
    nom: string;
    famille: { nom: string };
    service: { nom: string };
  };
  technicien: { nom: string; prenom: string } | null;
  tasks: Array<{ datePrevue: Date }>;
}

const periodiciteLabels: Record<string, string> = {
  HEBDOMADAIRE: "H",
  MENSUELLE: "M",
  TRIMESTRIELLE: "T",
  SEMESTRIELLE: "S",
  ANNUELLE: "A",
};

export function PlanningTable({ items }: { items: PlanningRow[] }) {
  return (
    <Table
      headers={[
        { key: "esu", label: "ESU" },
        { key: "equipement", label: "Equipement / Famille" },
        { key: "service", label: "AP / Service" },
        { key: "type", label: "Type (P)" },
        { key: "periodicite", label: "Periodicite" },
        { key: "date", label: "Date prevue" },
        { key: "etat", label: "Etat" },
        { key: "details", label: "Date realisation / details" },
      ]}
      emptyText="Aucun planning trouve."
    >
      {items.map((item, index) => (
        <tr
          key={item.id}
          className={index % 2 === 0 ? "bg-white" : "bg-primary-soft/20"}
        >
          <td className="px-4 py-3">
            <Badge label="ESU" />
          </td>
          <td className="px-4 py-3">
            <p className="font-semibold">{item.equipement.nom}</p>
            <p className="text-sm text-muted">{item.equipement.famille.nom}</p>
          </td>
          <td className="px-4 py-3">
            <Badge label={item.equipement.service.nom} className="bg-slate-100 text-slate-700" />
          </td>
          <td className="px-4 py-3 text-muted">{item.type.replaceAll("_", " ")}</td>
          <td className="px-4 py-3">
            <Badge
              label={periodiciteLabels[item.periodicite] || item.periodicite}
              className="bg-primary-soft text-primary"
            />
          </td>
          <td className="px-4 py-3 text-muted">
            {formatDate(item.tasks[0]?.datePrevue || item.dateDebut)}
          </td>
          <td className="px-4 py-3">
            <Badge
              label={item.actif ? "Planifie" : "Arrete"}
              className={item.actif ? "bg-teal-100 text-teal-900" : "bg-slate-200 text-slate-700"}
            />
          </td>
          <td className="px-4 py-3 text-muted">
            {item.technicien ? `${item.technicien.prenom} ${item.technicien.nom}` : "Non assigne"}
            {item.nuit ? " - Nuit" : ""}
          </td>
        </tr>
      ))}
    </Table>
  );
}
