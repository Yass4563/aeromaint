import { Role } from "@prisma/client";

import { EquipmentModal } from "@/components/equipment/equipment-modal";
import { QRCodeDisplay } from "@/components/equipment/qr-code-display";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [equipement, families, zones, services] = await Promise.all([
    prisma.equipement.findUnique({
      where: { id },
      include: {
        famille: true,
        zone: true,
        service: true,
        photos: true,
        plannings: {
          where: { actif: true },
          include: { technicien: true },
        },
        tasks: {
          take: 10,
          orderBy: { datePrevue: "desc" },
          include: { planning: true, rapport: true },
        },
      },
    }),
    prisma.famille.findMany({ orderBy: { nom: "asc" } }),
    prisma.zone.findMany({ orderBy: { nom: "asc" } }),
    prisma.service.findMany({ orderBy: { nom: "asc" } }),
  ]);

  if (!equipement) {
    return <div className="card">Equipement introuvable.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{equipement.nom}</h1>
          <div className="mt-3 flex gap-3">
            <Badge value={equipement.statut} />
            <Badge label={equipement.service.nom} />
            <Badge label={equipement.famille.nom} />
          </div>
        </div>
        {session?.user.role === Role.ADMIN ? (
          <EquipmentModal
            triggerLabel="Modifier"
            familles={families}
            zones={zones}
            services={services}
            value={equipement}
          />
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="card grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted">Code</p>
            <p className="font-semibold">{equipement.code || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Marque</p>
            <p className="font-semibold">{equipement.marque || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Numero de serie</p>
            <p className="font-semibold">{equipement.numeroSerie || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Prix d&apos;acquisition</p>
            <p className="font-semibold">{formatCurrency(equipement.prixAcquisition?.toString())}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Mise en service</p>
            <p className="font-semibold">{formatDate(equipement.miseEnService)}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Remplacement prevu</p>
            <p className="font-semibold">{formatDate(equipement.remplacementPrevu)}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Zone</p>
            <p className="font-semibold">{equipement.zone.nom}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Service</p>
            <p className="font-semibold">{equipement.service.nom}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted">Remarques</p>
            <p className="font-semibold">{equipement.remarques || "-"}</p>
          </div>
        </div>
        <QRCodeDisplay equipementId={equipement.id} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card">
          <h2 className="text-xl font-bold">Historique des maintenances</h2>
          <div className="mt-4 space-y-3">
            {equipement.tasks.map((task) => (
              <div key={task.id} className="rounded-2xl bg-primary-soft/30 px-4 py-3">
                <p className="font-semibold">{task.planning.type}</p>
                <p className="text-sm text-muted">{formatDate(task.datePrevue)}</p>
                <Badge value={task.statut} className="mt-2" />
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h2 className="text-xl font-bold">Photos</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {equipement.photos.map((photo) => (
              <img key={photo.id} src={photo.url} alt="Photo equipement" className="h-28 w-full rounded-2xl object-cover" />
            ))}
          </div>
        </section>
        <section className="card">
          <h2 className="text-xl font-bold">Plannings actifs</h2>
          <div className="mt-4 space-y-3">
            {equipement.plannings.map((planning) => (
              <div key={planning.id} className="rounded-2xl bg-primary-soft/30 px-4 py-3">
                <p className="font-semibold">{planning.type}</p>
                <p className="text-sm text-muted">{planning.periodicite}</p>
                <p className="text-sm text-muted">
                  {planning.technicien ? `${planning.technicien.prenom} ${planning.technicien.nom}` : "Non assigne"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
