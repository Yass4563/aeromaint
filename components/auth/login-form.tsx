"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Adresse email ou mot de passe invalide.");
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-[32px] border border-border bg-surface p-8 shadow-xl">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          ESU
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground">
          AeroMaint
        </h1>
        <p className="mt-3 text-sm text-muted">
          Suivi de la maintenance preventive aeroportuaire
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          label="Adresse email"
          type="email"
          required
          requiredMark
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="exemple@aeromaint.local"
        />
        <Input
          label="Mot de passe"
          type="password"
          required
          requiredMark
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Votre mot de passe"
        />
        {error ? (
          <p className="rounded-2xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
