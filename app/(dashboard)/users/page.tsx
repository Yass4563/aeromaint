import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { UserModal } from "@/components/users/user-modal";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function UsersPage() {
  const session = await auth();

  if (session?.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  const [users, services] = await Promise.all([
    prisma.user.findMany({
      include: { service: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    }),
    prisma.service.findMany({ orderBy: { nom: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Gestion des utilisateurs</h1>
          <p className="mt-2 text-sm text-muted">Administration des comptes et des roles.</p>
        </div>
        <UserModal services={services} />
      </div>
      <Table
        headers={[
          { key: "nom", label: "Nom" },
          { key: "prenom", label: "Prenom" },
          { key: "email", label: "Email" },
          { key: "role", label: "Role" },
          { key: "service", label: "Service" },
          { key: "statut", label: "Statut" },
        ]}
      >
        {users.map((user) => (
          <tr key={user.id}>
            <td className="px-4 py-3">{user.nom}</td>
            <td className="px-4 py-3">{user.prenom}</td>
            <td className="px-4 py-3 text-muted">{user.email}</td>
            <td className="px-4 py-3">
              <Badge label={user.role} />
            </td>
            <td className="px-4 py-3 text-muted">{user.service?.nom || "-"}</td>
            <td className="px-4 py-3">
              <Badge label={user.actif ? "Actif" : "Inactif"} />
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
