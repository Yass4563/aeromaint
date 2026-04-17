"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface SubmittedTask {
  id: string;
  datePrevue: string | Date;
  equipement: { nom: string; famille: { nom: string }; zone: { nom: string } };
  planning: { type: string };
  technicien: { nom: string; prenom: string } | null;
}

export function SubmittedTasksBoard({ items }: { items: SubmittedTask[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function action(taskId: string, type: "validate" | "reject") {
    setPendingId(taskId);
    const response = await fetch(`/api/tasks/${taskId}/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        type === "reject"
          ? { commentaire: "Rapport a completer avant validation." }
          : { commentaire: "Validation superviseur." },
      ),
    });
    setPendingId(null);

    if (!response.ok) {
      showToast({ type: "error", title: "Action impossible sur cette tache." });
      return;
    }

    showToast({
      type: "success",
      title: type === "validate" ? "Tache validee." : "Tache rejetee.",
    });
    router.refresh();
  }

  return (
    <Table
      headers={[
        { key: "equipement", label: "Equipement" },
        { key: "type", label: "Type" },
        { key: "date", label: "Date prevue" },
        { key: "zone", label: "Zone" },
        { key: "technicien", label: "Technicien" },
        { key: "statut", label: "Statut" },
        { key: "actions", label: "Actions" },
      ]}
      emptyText="Aucune tache soumise pour validation."
    >
      {items.map((item) => (
        <tr key={item.id}>
          <td className="px-4 py-3">
            <p className="font-semibold">{item.equipement.nom}</p>
            <p className="text-sm text-muted">{item.equipement.famille.nom}</p>
          </td>
          <td className="px-4 py-3 text-muted">{item.planning.type}</td>
          <td className="px-4 py-3 text-muted">{formatDate(item.datePrevue)}</td>
          <td className="px-4 py-3 text-muted">{item.equipement.zone.nom}</td>
          <td className="px-4 py-3 text-muted">
            {item.technicien ? `${item.technicien.prenom} ${item.technicien.nom}` : "Non assigne"}
          </td>
          <td className="px-4 py-3">
            <Badge value="SOUMISE" />
          </td>
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => action(item.id, "validate")} disabled={pendingId === item.id}>
                Valider
              </Button>
              <Button size="sm" variant="danger" onClick={() => action(item.id, "reject")} disabled={pendingId === item.id}>
                Rejeter
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </Table>
  );
}
