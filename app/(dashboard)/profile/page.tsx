import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { service: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Mon profil</h1>
        <p className="mt-2 text-sm text-muted">
          Informations de compte et role d&apos;acces.
        </p>
      </div>
      <div className="card grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted">Nom complet</p>
          <p className="font-semibold">
            {user?.prenom} {user?.nom}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">Email</p>
          <p className="font-semibold">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Role</p>
          <p className="font-semibold">{user?.role}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Service</p>
          <p className="font-semibold">{user?.service?.nom || "-"}</p>
        </div>
      </div>
    </div>
  );
}
