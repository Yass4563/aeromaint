"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

interface TaskDetail {
  id: string;
  statut: string;
  datePrevue: string;
  equipement: {
    nom: string;
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
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !taskId) {
      return;
    }

    setLoading(true);
    fetch(`/api/tasks/${taskId}`)
      .then((response) => response.json())
      .then((json: TaskDetail) => {
        setTask(json);
        setDescription(json.rapport?.description || "");
        setDateIntervention(
          json.rapport?.dateIntervention
            ? new Date(json.rapport.dateIntervention).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
        );
        setPhotoUrls(json.rapport?.photos?.map((photo) => photo.url) || []);
      })
      .finally(() => setLoading(false));
  }, [open, taskId]);

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
        photoUrls,
      }),
    });
    setSaving(false);

    if (!response.ok) {
      showToast({ type: "error", title: "Impossible de soumettre l intervention." });
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
          <div className="space-y-3">
            <label className="inline-flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => handleUpload(event.target.files)} />
              Ajouter des photos
            </label>
            {photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {photoUrls.map((url) => (
                  <img key={url} src={url} alt="Photo de rapport" className="h-28 w-full rounded-2xl object-cover" />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
