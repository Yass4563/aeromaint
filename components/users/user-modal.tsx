"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

interface ServiceOption {
  id: string;
  nom: string;
}

interface UserValue {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: "ADMIN" | "SUPERVISEUR" | "TECHNICIEN";
  serviceId: string | null;
  actif: boolean;
}

export function UserModal({
  services,
  value,
  triggerLabel = "Creer un utilisateur",
  title = "Creer un utilisateur",
  triggerVariant = "primary",
}: {
  services: ServiceOption[];
  value?: UserValue;
  triggerLabel?: string;
  title?: string;
  triggerVariant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nom: value?.nom || "",
    prenom: value?.prenom || "",
    email: value?.email || "",
    password: "",
    role: value?.role || "TECHNICIEN",
    serviceId: value?.serviceId || "",
    actif: value?.actif ?? true,
  });

  async function submitUser() {
    setLoading(true);
    const response = await fetch(value ? `/api/users/${value.id}` : "/api/users", {
      method: value ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        serviceId: form.serviceId || undefined,
        password: form.password || undefined,
      }),
    });
    setLoading(false);

    if (!response.ok) {
      showToast({
        type: "error",
        title: value ? "Impossible de mettre a jour l'utilisateur." : "Impossible de creer l'utilisateur.",
      });
      return;
    }

    showToast({
      type: "success",
      title: value ? "Utilisateur mis a jour." : "Utilisateur cree.",
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant={triggerVariant} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <div className="flex justify-end">
            <Button onClick={submitUser} disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nom" requiredMark value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <Input label="Prenom" requiredMark value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          <Input label="Email" requiredMark type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input
            label={value ? "Mot de passe (laisser vide pour conserver l'actuel)" : "Mot de passe"}
            requiredMark={!value}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) =>
              setForm({
                ...form,
                role: e.target.value as "ADMIN" | "SUPERVISEUR" | "TECHNICIEN",
              })
            }
          >
            <option value="ADMIN">Admin</option>
            <option value="SUPERVISEUR">Superviseur</option>
            <option value="TECHNICIEN">Technicien</option>
          </Select>
          <Select label="Service" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
            <option value="">Aucun service</option>
            {services.map((service) => <option key={service.id} value={service.id}>{service.nom}</option>)}
          </Select>
          <label className="flex items-center gap-3 pt-8">
            <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} />
            <span className="text-sm font-medium">Actif</span>
          </label>
        </div>
      </Modal>
    </>
  );
}
