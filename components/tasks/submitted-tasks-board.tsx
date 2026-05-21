"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelected = useMemo(
    () => items.length > 0 && selectedIds.length === items.length,
    [items.length, selectedIds.length],
  );

  async function runAction(taskId: string, type: "validate" | "reject") {
    const response = await fetch(`/api/tasks/${taskId}/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        type === "reject"
          ? { commentaire: "Rapport a completer avant validation." }
          : { commentaire: "Validation superviseur." },
      ),
    });
    return response.ok;
  }

  async function action(taskId: string, type: "validate" | "reject") {
    setPendingId(taskId);
    const success = await runAction(taskId, type);
    setPendingId(null);

    if (!success) {
      showToast({ type: "error", title: "Action impossible sur cette tache." });
      return;
    }

    showToast({
      type: "success",
      title: type === "validate" ? "Tache validee." : "Tache rejetee.",
    });
    setSelectedIds((current) => current.filter((id) => id !== taskId));
    router.refresh();
  }

  function toggleTask(taskId: string) {
    setSelectedIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : items.map((item) => item.id));
  }

  async function bulkValidate() {
    if (selectedIds.length === 0) {
      showToast({ type: "error", title: "Selectionnez au moins une tache." });
      return;
    }

    setBulkLoading(true);
    const results = await Promise.all(selectedIds.map((taskId) => runAction(taskId, "validate")));
    setBulkLoading(false);

    const successCount = results.filter(Boolean).length;
    const failureCount = results.length - successCount;

    if (successCount === 0) {
      showToast({ type: "error", title: "Aucune tache n'a pu etre validee." });
      return;
    }

    showToast({
      type: failureCount > 0 ? "error" : "success",
      title:
        failureCount > 0
          ? `${successCount} tache(s) validee(s), ${failureCount} en echec.`
          : `${successCount} tache(s) validee(s) en masse.`,
    });
    setSelectedIds([]);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Selection superviseur</p>
          <p className="text-sm text-muted">
            {selectedIds.length} tache(s) selectionnee(s) sur {items.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={toggleAll}>
            {allSelected ? "Tout deselectionner" : "Tout selectionner"}
          </Button>
          <Button type="button" size="sm" onClick={bulkValidate} disabled={bulkLoading || selectedIds.length === 0}>
            {bulkLoading ? "Validation..." : "Valider la selection"}
          </Button>
        </div>
      </div>

      <Table
        headers={[
          { key: "selection", label: "" },
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
        {items.map((item, index) => (
          <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-primary-soft/20"}>
            <td className="px-4 py-3">
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => toggleTask(item.id)}
                aria-label={`Selectionner la tache ${item.equipement.nom}`}
              />
            </td>
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
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => action(item.id, "reject")}
                  disabled={pendingId === item.id}
                >
                  Rejeter
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
