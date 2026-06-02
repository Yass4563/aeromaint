"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/client-api";
import { formatDate } from "@/lib/utils";

interface TaskDetail {
  id: string;
  statut: string;
  datePrevue: string;
  equipement: {
    nom: string;
    statut: string;
    famille: { nom: string };
    zone: { nom: string };
    service: { nom: string };
  };
  planning: {
    type: string;
  };
  rapport?: {
    id: string;
    description: string;
    dateIntervention: string;
    photos: Array<{ url: string }>;
  } | null;
}

export function MaintenanceForm({
  taskId,
  open,
  onClose,
}: {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [dateIntervention, setDateIntervention] = useState(new Date().toISOString().slice(0, 16));
  const [equipementStatut, setEquipementStatut] = useState("EN_SERVICE");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !taskId) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setTask(null);
    fetch(`/api/tasks/${taskId}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            await getApiErrorMessage(response, "Impossible de charger cette tache."),
          );
        }

        return response.json();
      })
      .then((json: TaskDetail) => {
        setTask(json);
        setDescription(json.rapport?.description || "");
        setDateIntervention(
          json.rapport?.dateIntervention
            ? new Date(json.rapport.dateIntervention).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
        );
        setEquipementStatut(json.equipement.statut === "EN_PANNE" ? "EN_PANNE" : "EN_SERVICE");
        setPhotoUrls(json.rapport?.photos?.map((photo) => photo.url) || []);
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        showToast({
          type: "error",
          title: error instanceof Error ? error.message : "Impossible de charger cette tache.",
        });
        onClose();
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [onClose, open, showToast, taskId]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const json = await response.json();

    if (!response.ok) {
      showToast({ type: "error", title: "Echec du televersement des photos." });
      return;
    }

    if ("fichiers" in json) {
      setPhotoUrls((current) => [...current, ...json.fichiers.map((item: { url: string }) => item.url)]);
    } else {
      setPhotoUrls((current) => [...current, json.url]);
    }
  }

  async function handleSubmit() {
    if (!taskId) return;
    setSaving(true);
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        description,
        dateIntervention,
        equipementStatut,
        photoUrls,
      }),
    });
    setSaving(false);

    if (!response.ok) {
      const message = await getApiErrorMessage(
        response,
        "Impossible de soumettre l intervention.",
      );
      showToast({
        type: "error",
        title: "Impossible de soumettre l intervention.",
        description: message,
      });
      return;
    }

    const report = await response.json();
    showToast({ type: "success", title: "Intervention soumise." });
    if (report?.id) {
      window.open(`/api/reports/${report.id}/pdf`, "_blank");
    }
    router.refresh();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rapport d intervention"
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          {task?.rapport?.id ? (
            <a
              href={`/api/reports/${task.rapport.id}/pdf`}
              target="_blank"
              className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm font-medium"
            >
              Exporter en PDF
            </a>
          ) : null}
          <Button onClick={handleSubmit} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Soumission..." : "Soumettre l intervention"}
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : task ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Equipement</p>
              <p className="mt-2 font-semibold">{task.equipement.nom}</p>
              <p className="text-sm text-muted">{task.equipement.famille.nom}</p>
              <p className="text-sm text-muted">{task.equipement.zone.nom}</p>
              <p className="text-sm text-muted">{task.equipement.service.nom}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Intervention</p>
              <p className="mt-2 text-sm text-muted">Type : {task.planning.type}</p>
              <p className="text-sm text-muted">Date prevue : {formatDate(task.datePrevue)}</p>
              <label className="mt-4 block text-sm font-medium">
                Date d intervention
                <input
                  type="datetime-local"
                  className="mt-2 w-full rounded-xl border border-border px-4 py-3"
                  value={dateIntervention}
                  onChange={(event) => setDateIntervention(event.target.value)}
                />
              </label>
            </div>
          </div>
          <Textarea
            label="Description / Observations"
            requiredMark
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Decrivez l'intervention realisee..."
          />
          {task.equipement.statut === "HORS_SERVICE" ? (
            <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-muted">
              Cet equipement est hors service. Son statut administratif restera inchange.
            </div>
          ) : (
            <Select
              label="Etat de l'equipement apres l'intervention"
              value={equipementStatut}
              onChange={(event) => setEquipementStatut(event.target.value)}
            >
              <option value="EN_SERVICE">En service - l&apos;equipement est operationnel</option>
              <option value="EN_PANNE">En panne - l&apos;equipement est inoperable</option>
            </Select>
          )}
          <div className="space-y-3">
            <label className="inline-flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3">
              <input type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={(event) => handleUpload(event.target.files)} />
              Ajouter des photos
            </label>
            {photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {photoUrls.map((url) => (
                  <Image
                    key={url}
                    src={url}
                    alt="Photo de rapport"
                    width={240}
                    height={112}
                    unoptimized
                    className="h-28 w-full rounded-2xl object-cover"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
