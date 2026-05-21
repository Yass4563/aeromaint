"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/client-api";

interface Option {
  id: string;
  nom: string;
}

type ReferenceKind = "famille" | "zone" | "service";

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
  const [referenceModalOpen, setReferenceModalOpen] = useState(false);
  const [creatingReference, setCreatingReference] = useState(false);
  const [referenceKind, setReferenceKind] = useState<ReferenceKind>("famille");
  const [newReferenceName, setNewReferenceName] = useState("");
  const [familyOptions, setFamilyOptions] = useState(familles);
  const [zoneOptions, setZoneOptions] = useState(zones);
  const [serviceOptions, setServiceOptions] = useState(services);
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
  const referencesReady = familyOptions.length > 0 && zoneOptions.length > 0 && serviceOptions.length > 0;

  async function onSubmit() {
    if (!referencesReady) {
      showToast({
        type: "error",
        title: "References incompletes.",
        description: "Ajoutez au moins une famille, une zone et un service avant d'enregistrer l'equipement.",
      });
      return;
    }

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
      const message = await getApiErrorMessage(
        response,
        "Impossible d'enregistrer l'equipement.",
      );
      showToast({
        type: "error",
        title: "Impossible d'enregistrer l'equipement.",
        description: message,
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

  function openReferenceModal(kind: ReferenceKind) {
    setReferenceKind(kind);
    setNewReferenceName("");
    setReferenceModalOpen(true);
  }

  async function createReference() {
    if (!newReferenceName.trim()) {
      showToast({
        type: "error",
        title: "Saisissez un nom avant de continuer.",
      });
      return;
    }

    const endpointByKind: Record<ReferenceKind, string> = {
      famille: "/api/families",
      zone: "/api/zones",
      service: "/api/services",
    };
    const labelByKind: Record<ReferenceKind, string> = {
      famille: "famille d'equipement",
      zone: "zone",
      service: "service",
    };

    setCreatingReference(true);
    const response = await fetch(endpointByKind[referenceKind], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: newReferenceName.trim() }),
    });
    setCreatingReference(false);

    if (!response.ok) {
      const message = await getApiErrorMessage(
        response,
        `Impossible de creer la ${labelByKind[referenceKind]}.`,
      );
      showToast({
        type: "error",
        title: `Impossible de creer la ${labelByKind[referenceKind]}.`,
        description: message,
      });
      return;
    }

    const option = (await response.json()) as Option;

    if (referenceKind === "famille") {
      const nextFamilies = [...familyOptions, option].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
      setFamilyOptions(nextFamilies);
      setForm((current) => ({ ...current, familleId: option.id }));
    }

    if (referenceKind === "zone") {
      const nextZones = [...zoneOptions, option].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
      setZoneOptions(nextZones);
      setForm((current) => ({ ...current, zoneId: option.id }));
    }

    if (referenceKind === "service") {
      const nextServices = [...serviceOptions, option].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
      setServiceOptions(nextServices);
      setForm((current) => ({ ...current, serviceId: option.id }));
    }

    setNewReferenceName("");
    setReferenceModalOpen(false);
    showToast({
      type: "success",
      title: "Nouvelle reference ajoutee.",
    });
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
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                Famille d&apos;equipement
                <span className="text-danger"> *</span>
              </span>
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:underline"
                onClick={() => openReferenceModal("famille")}
              >
                Ajouter une famille
              </button>
            </div>
            <Select value={form.familleId} onChange={(e) => setForm({ ...form, familleId: e.target.value })}>
              {familyOptions.length === 0 ? <option value="">Aucune famille disponible</option> : null}
              {familyOptions.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                Zone
                <span className="text-danger"> *</span>
              </span>
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:underline"
                onClick={() => openReferenceModal("zone")}
              >
                Ajouter une zone
              </button>
            </div>
            <Select value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })}>
              {zoneOptions.length === 0 ? <option value="">Aucune zone disponible</option> : null}
              {zoneOptions.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">
                Service
                <span className="text-danger"> *</span>
              </span>
              <button
                type="button"
                className="text-sm font-semibold text-primary hover:underline"
                onClick={() => openReferenceModal("service")}
              >
                Ajouter un service
              </button>
            </div>
            <Select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
              {serviceOptions.length === 0 ? <option value="">Aucun service disponible</option> : null}
              {serviceOptions.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
            </Select>
          </div>
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
        {!referencesReady ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Pour creer un equipement, il faut au moins une famille, une zone et un service. Utilisez les liens
            d&apos;ajout ci-dessus pour completer le referentiel.
          </div>
        ) : null}
      </Modal>
      <Modal
        open={referenceModalOpen}
        onClose={() => setReferenceModalOpen(false)}
        title={
          referenceKind === "famille"
            ? "Ajouter une famille d'equipement"
            : referenceKind === "zone"
              ? "Ajouter une zone"
              : "Ajouter un service"
        }
        className="max-w-xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setReferenceModalOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={createReference} disabled={creatingReference}>
              {creatingReference ? "Creation..." : "Enregistrer"}
            </Button>
          </div>
        }
      >
        <Input
          label={
            referenceKind === "famille"
              ? "Nom de la famille"
              : referenceKind === "zone"
                ? "Nom de la zone"
                : "Nom du service"
          }
          requiredMark
          value={newReferenceName}
          onChange={(e) => setNewReferenceName(e.target.value)}
          placeholder={
            referenceKind === "famille"
              ? "Exemple : Convoyeur bagages"
              : referenceKind === "zone"
                ? "Exemple : Atelier piste"
                : "Exemple : Instrumentation"
          }
        />
      </Modal>
    </>
  );
}
