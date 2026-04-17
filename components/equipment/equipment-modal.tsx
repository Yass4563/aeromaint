"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/providers/toast-provider";

interface Option {
  id: string;
  nom: string;
}

interface EquipmentValue {
  id?: string;
  nom?: string;
  code?: string | null;
  marque?: string | null;
  numeroSerie?: string | null;
  prixAcquisition?: number | string | { toString(): string } | null;
  modeIntegre?: boolean;
  familleId?: string;
  zoneId?: string;
  serviceId?: string;
  miseEnService?: Date | null;
  remplacementPrevu?: Date | null;
  dateArret?: Date | null;
  remarques?: string | null;
}

function toDateInput(value?: Date | string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function EquipmentModal({
  triggerLabel,
  familles,
  zones,
  services,
  value,
}: {
  triggerLabel: string;
  familles: Option[];
  zones: Option[];
  services: Option[];
  value?: EquipmentValue;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nom: value?.nom || "",
    code: value?.code || "",
    marque: value?.marque || "",
    numeroSerie: value?.numeroSerie || "",
    prixAcquisition: value?.prixAcquisition?.toString() || "",
    modeIntegre: value?.modeIntegre || false,
    familleId: value?.familleId || familles[0]?.id || "",
    zoneId: value?.zoneId || zones[0]?.id || "",
    serviceId: value?.serviceId || services[0]?.id || "",
    miseEnService: toDateInput(value?.miseEnService),
    remplacementPrevu: toDateInput(value?.remplacementPrevu),
    dateArret: toDateInput(value?.dateArret),
    remarques: value?.remarques || "",
  });

  async function onSubmit() {
    setLoading(true);
    const endpoint = value?.id ? `/api/equipment/${value.id}` : "/api/equipment";
    const method = value?.id ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        prixAcquisition: form.prixAcquisition ? Number(form.prixAcquisition) : undefined,
        miseEnService: form.miseEnService || undefined,
        remplacementPrevu: form.remplacementPrevu || undefined,
        dateArret: form.dateArret || undefined,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      showToast({
        type: "error",
        title: "Impossible d'enregistrer l'equipement.",
      });
      return;
    }

    showToast({
      type: "success",
      title: value?.id ? "Equipement mis a jour." : "Equipement cree.",
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={value?.id ? "Modifier l'equipement" : "Ajouter un equipement"}
        footer={
          <div className="flex justify-end">
            <Button onClick={onSubmit} disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Equipement" requiredMark value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label="Marque" value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} />
          <Input label="Numero de serie" value={form.numeroSerie} onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })} />
          <Input label="Prix d'acquisition" type="number" value={form.prixAcquisition} onChange={(e) => setForm({ ...form, prixAcquisition: e.target.value })} />
          <Select label="Famille d'equipement" value={form.familleId} onChange={(e) => setForm({ ...form, familleId: e.target.value })}>
            {familles.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
          </Select>
          <Select label="Zone" value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })}>
            {zones.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
          </Select>
          <Select label="Service" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
            {services.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
          </Select>
          <Input label="Mise en service" type="date" value={form.miseEnService} onChange={(e) => setForm({ ...form, miseEnService: e.target.value })} />
          <Input label="Date proposee de remplacement" type="date" value={form.remplacementPrevu} onChange={(e) => setForm({ ...form, remplacementPrevu: e.target.value })} />
          <Input label="Date d'arret" type="date" value={form.dateArret} onChange={(e) => setForm({ ...form, dateArret: e.target.value })} />
          <label className="flex items-center gap-3 pt-8">
            <input type="checkbox" checked={form.modeIntegre} onChange={(e) => setForm({ ...form, modeIntegre: e.target.checked })} />
            <span className="text-sm font-medium">Mode integre</span>
          </label>
        </div>
        <div className="mt-4">
          <Textarea label="Remarques" value={form.remarques} onChange={(e) => setForm({ ...form, remarques: e.target.value })} />
        </div>
      </Modal>
    </>
  );
}
