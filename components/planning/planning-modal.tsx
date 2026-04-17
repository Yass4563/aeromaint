"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/providers/toast-provider";

interface EquipmentOption {
  id: string;
  nom: string;
}

interface UserOption {
  id: string;
  nom: string;
  prenom: string;
}

export function PlanningModal({
  equipements,
  techniciens,
}: {
  equipements: EquipmentOption[];
  techniciens: UserOption[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    equipementId: equipements[0]?.id || "",
    type: "ENTRETIEN",
    periodicite: "MENSUELLE",
    dateDebut: new Date().toISOString().slice(0, 10),
    eviterWeekend: true,
    nuit: false,
    technicienId: "",
  });

  async function submit() {
    setLoading(true);
    const response = await fetch("/api/planning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        technicienId: form.technicienId || undefined,
      }),
    });
    setLoading(false);

    if (!response.ok) {
      showToast({ type: "error", title: "Impossible d'ajouter le planning." });
      return;
    }

    showToast({ type: "success", title: "Planning enregistre." });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Planification</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Ajouter un planning pour : ${equipements.find((item) => item.id === form.equipementId)?.nom || ""}`}
        footer={
          <div className="flex justify-end">
            <Button onClick={submit} disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Select label="Equipement" value={form.equipementId} onChange={(e) => setForm({ ...form, equipementId: e.target.value })}>
            {equipements.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
          </Select>
          <div className="space-y-3">
            <p className="text-sm font-medium">Type de la maintenance</p>
            {[
              { value: "ENTRETIEN", label: "Entretien" },
              { value: "ETALONNAGE", label: "Etalonnage" },
              { value: "CONTROLES_REGLEMENTAIRES", label: "Controles reglementaires" },
            ].map((item) => (
              <label key={item.value} className="flex items-center gap-3 text-sm">
                <input type="radio" name="type" checked={form.type === item.value} onChange={() => setForm({ ...form, type: item.value })} />
                {item.label}
              </label>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Periodicite</p>
            {[
              { value: "ANNUELLE", label: "Annuelle" },
              { value: "SEMESTRIELLE", label: "Semestrielle" },
              { value: "TRIMESTRIELLE", label: "Trimestrielle" },
              { value: "MENSUELLE", label: "Mensuelle" },
              { value: "HEBDOMADAIRE", label: "Hebdomadaire" },
            ].map((item) => (
              <label key={item.value} className="flex items-center gap-3 text-sm">
                <input type="radio" name="periodicite" checked={form.periodicite === item.value} onChange={() => setForm({ ...form, periodicite: item.value })} />
                {item.label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Date de la maintenance" type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} />
          <Select label="Technicien" value={form.technicienId} onChange={(e) => setForm({ ...form, technicienId: e.target.value })}>
            <option value="">Non assigne</option>
            {techniciens.map((item) => <option key={item.id} value={item.id}>{item.prenom} {item.nom}</option>)}
          </Select>
        </div>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={form.eviterWeekend} onChange={(e) => setForm({ ...form, eviterWeekend: e.target.checked })} />
            Eviter Samedi et Dimanche
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={form.nuit} onChange={(e) => setForm({ ...form, nuit: e.target.checked })} />
            A realiser seulement pendant la nuit
          </label>
          <label className="flex items-center gap-3 text-sm text-muted">
            <input type="checkbox" checked readOnly />
            Une seule journee seulement
          </label>
        </div>
      </Modal>
    </>
  );
}
