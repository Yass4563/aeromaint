"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { UserModal } from "@/components/users/user-modal";

interface ServiceOption {
  id: string;
  nom: string;
}

interface UserRowActionsProps {
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: "ADMIN" | "SUPERVISEUR" | "TECHNICIEN";
    serviceId: string | null;
    actif: boolean;
  };
  services: ServiceOption[];
  isCurrentUser: boolean;
}

export function UserRowActions({
  user,
  services,
  isCurrentUser,
}: UserRowActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);

    const response = await fetch(
      user.actif ? `/api/users/${user.id}` : `/api/users/${user.id}`,
      {
        method: user.actif ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: user.actif ? undefined : JSON.stringify({ actif: true }),
      },
    );

    setLoading(false);

    if (!response.ok) {
      showToast({ type: "error", title: "Impossible de mettre a jour ce compte." });
      return;
    }

    showToast({
      type: "success",
      title: user.actif ? "Utilisateur desactive." : "Utilisateur reactive.",
    });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <UserModal
        services={services}
        value={user}
        triggerLabel="Modifier"
        title={`Modifier l'utilisateur : ${user.prenom} ${user.nom}`}
        triggerVariant="ghost"
      />
      {!isCurrentUser ? (
        <Button
          type="button"
          size="sm"
          variant={user.actif ? "danger" : "secondary"}
          disabled={loading}
          onClick={toggleActive}
        >
          {user.actif ? "Desactiver" : "Reactiver"}
        </Button>
      ) : (
        <span className="inline-flex items-center rounded-xl bg-primary-soft px-3 py-2 text-xs font-semibold text-foreground">
          Session actuelle
        </span>
      )}
    </div>
  );
}
