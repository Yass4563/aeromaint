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
  const periodiciteOptions = [
    { value: "ANNUELLE", label: "Annuelle" },
    { value: "SEMESTRIELLE", label: "Semestrielle" },
    { value: "TRIMESTRIELLE", label: "Trimestrielle" },
    { value: "MENSUELLE", label: "Mensuelle" },
    { value: "HEBDOMADAIRE", label: "Hebdomadaire" },
  ] as const;
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

  function selectPeriodicite(value: (typeof periodiciteOptions)[number]["value"]) {
    setForm((current) => ({ ...current, periodicite: value }));
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={equipements.length === 0}>
        Planification
      </Button>
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
        <div className="mb-5">
          <Select
            label="Equipement"
            value={form.equipementId}
            onChange={(e) => setForm({ ...form, equipementId: e.target.value })}
          >
            {equipements.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nom}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-border bg-primary-soft/20 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
              Type de la maintenance
            </p>
            <div className="mt-4 space-y-3">
              {[
                { value: "ENTRETIEN", label: "Entretien" },
                { value: "ETALONNAGE", label: "Etalonnage" },
                { value: "CONTROLES_REGLEMENTAIRES", label: "Controles reglementaires" },
              ].map((item) => (
                <label key={item.value} className="flex items-start gap-3 rounded-xl bg-white px-3 py-3 text-sm shadow-sm">
                  <input
                    type="radio"
                    name="type"
                    checked={form.type === item.value}
                    onChange={() => setForm({ ...form, type: item.value })}
                    className="mt-1"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-primary-soft/20 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
              Date de la maintenance
            </p>
            <div className="mt-4 space-y-4">
              <Input
                label="Date prevue"
                type="date"
                value={form.dateDebut}
                onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
              />
              <Select
                label="Technicien"
                value={form.technicienId}
                onChange={(e) => setForm({ ...form, technicienId: e.target.value })}
              >
                <option value="">Non assigne</option>
                {techniciens.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.prenom} {item.nom}
                  </option>
                ))}
              </Select>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-primary-soft/20 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
              Periodicite
            </p>
            <div className="mt-4 space-y-3">
              {periodiciteOptions.map((item) => (
                <label key={item.value} className="flex items-start gap-3 rounded-xl bg-white px-3 py-3 text-sm shadow-sm">
                  <input
                    type="radio"
                    name="periodicite"
                    checked={form.periodicite === item.value}
                    onChange={() => selectPeriodicite(item.value)}
                    className="mt-1"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl border border-border bg-primary-soft/10 px-4 py-4 md:grid-cols-2">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.eviterWeekend}
              onChange={(e) => setForm({ ...form, eviterWeekend: e.target.checked })}
            />
            Eviter Samedi et Dimanche
          </label>
          <label className="flex items-center gap-3 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.nuit}
              onChange={(e) => setForm({ ...form, nuit: e.target.checked })}
            />
            A realiser seulement pendant la nuit
          </label>
        </div>
      </Modal>
    </>
  );
}
