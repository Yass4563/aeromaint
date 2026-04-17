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

export function UserModal({ services }: { services: ServiceOption[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    role: "TECHNICIEN",
    serviceId: "",
    actif: true,
  });

  async function createUser() {
    setLoading(true);
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        serviceId: form.serviceId || undefined,
      }),
    });
    setLoading(false);

    if (!response.ok) {
      showToast({ type: "error", title: "Impossible de creer l'utilisateur." });
      return;
    }

    showToast({ type: "success", title: "Utilisateur cree." });
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Creer un utilisateur</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Creer un utilisateur"
        footer={
          <div className="flex justify-end">
            <Button onClick={createUser} disabled={loading}>
              {loading ? "Creation..." : "Enregistrer"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <Input label="Prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Mot de passe" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
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
