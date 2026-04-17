import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

interface EquipmentRow {
  id: string;
  nom: string;
  code: string | null;
  marque: string | null;
  prixAcquisition: unknown;
  modeIntegre: boolean;
  miseEnService: Date | null;
  remplacementPrevu: Date | null;
  remarques: string | null;
  statut: string;
  famille: { nom: string };
  zone: { nom: string };
  service: { nom: string };
}

export function EquipmentTable({ items }: { items: EquipmentRow[] }) {
  return (
    <Table
      headers={[
        { key: "equipement", label: "Equipement" },
        { key: "marque", label: "Marque / Code" },
        { key: "prix", label: "Prix d'acquisition" },
        { key: "mode", label: "Mode integre" },
        { key: "service", label: "AP / Service" },
        { key: "zone", label: "Installation / Zone" },
        { key: "mise", label: "Mise en service" },
        { key: "remplacement", label: "Remplacement prevu" },
        { key: "famille", label: "Service / Famille" },
        { key: "remarques", label: "Remarques" },
        { key: "actions", label: "Actions" },
      ]}
      emptyText="Aucun equipement trouve."
    >
      {items.map((item, index) => (
        <tr
          key={item.id}
          className={index % 2 === 0 ? "bg-white" : "bg-primary-soft/20"}
        >
          <td className="px-4 py-3">
            <div className="space-y-2">
              <p className="font-semibold">{item.nom}</p>
              <div className="flex flex-wrap gap-2">
                <Badge value={item.statut} />
                <Badge label={item.famille.nom} className="bg-slate-100 text-slate-700" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-muted">
            <div>
              <p>{item.marque || "-"}</p>
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.code || "-"}</p>
            </div>
          </td>
          <td className="px-4 py-3 text-muted">
            {formatCurrency(item.prixAcquisition as string | number | null)}
          </td>
          <td className="px-4 py-3 text-muted">{item.modeIntegre ? "Integre" : "Standard"}</td>
          <td className="px-4 py-3">
            <Badge label={item.service.nom} />
          </td>
          <td className="px-4 py-3 text-muted">
            <div>
              <p>{item.zone.nom}</p>
              <p className="text-xs text-slate-500">Installation ESU</p>
            </div>
          </td>
          <td className="px-4 py-3 text-muted">{formatDate(item.miseEnService)}</td>
          <td className="px-4 py-3 text-muted">{formatDate(item.remplacementPrevu)}</td>
          <td className="px-4 py-3 text-muted">
            {item.service.nom} / {item.famille.nom}
          </td>
          <td className="max-w-[220px] px-4 py-3 text-muted">{item.remarques || "-"}</td>
          <td className="px-4 py-3">
            <Link href={`/equipment/${item.id}`} className="font-medium text-primary hover:underline">
              Ouvrir
            </Link>
          </td>
        </tr>
      ))}
    </Table>
  );
}
