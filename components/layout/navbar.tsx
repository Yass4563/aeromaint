import Link from "next/link";
import { Role } from "@prisma/client";

import { NotificationBell } from "@/components/layout/notification-bell";
import { LogoutButton } from "@/components/layout/logout-button";
import { Badge } from "@/components/ui/badge";

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  SUPERVISEUR: "Superviseur",
  TECHNICIEN: "Technicien",
};

export function Navbar({
  user,
}: {
  user: { nom: string; prenom: string; role: Role };
}) {
  const links = [
    { href: "/dashboard", label: "Accueil", roles: ["ADMIN", "SUPERVISEUR", "TECHNICIEN"] },
    { href: "/equipment", label: "Equipements", roles: ["ADMIN", "SUPERVISEUR", "TECHNICIEN"] },
    { href: "/planning", label: "Planification", roles: ["ADMIN", "SUPERVISEUR"] },
    { href: "/tasks", label: "Taches", roles: ["ADMIN", "SUPERVISEUR", "TECHNICIEN"] },
    { href: "/kpi", label: "Indicateurs", roles: ["ADMIN", "SUPERVISEUR", "TECHNICIEN"] },
    { href: "/users", label: "Utilisateurs", roles: ["ADMIN"] },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3">
        <Link href="/dashboard" className="text-xl font-black tracking-tight text-primary">
          AeroMaint
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
          {links
            .filter((link) => link.roles.includes(user.role))
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-primary-soft hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
        </nav>
        <div className="flex items-center gap-3">
          <NotificationBell role={user.role} />
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-foreground">
              {user.prenom} {user.nom}
            </p>
            <Badge label={roleLabels[user.role]} />
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
