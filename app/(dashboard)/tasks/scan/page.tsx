import { redirect } from "next/navigation";
import { Role, TaskStatut } from "@prisma/client";

import { QRScanner } from "@/components/tasks/qr-scanner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeQrCodeValue } from "@/lib/qr-identification";

export default async function TaskScanPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = (await searchParams) || {};
  const qr = normalizeQrCodeValue(typeof params.qr === "string" ? params.qr : undefined);

  if (typeof params.qr === "string") {
    if (!qr) {
      return <QRScanner initialError="QR code invalide." />;
    }

    const equipement = await prisma.equipement.findUnique({
      where: { qrCode: qr },
    });

    if (equipement) {
      if (session?.user.role !== Role.TECHNICIEN) {
        redirect(`/equipment/${equipement.id}`);
      }

      const task = await prisma.task.findFirst({
        where: {
          equipementId: equipement.id,
          technicienId: session.user.id,
          statut: {
            in: [TaskStatut.OUVERTE, TaskStatut.REJETEE],
          },
        },
        orderBy: { datePrevue: "asc" },
      });

      if (task) {
        redirect(`/tasks?openTask=${task.id}`);
      }

      return (
        <QRScanner initialError="Aucune tache ouverte ou rejetee ne vous est assignee pour cet equipement." />
      );
    }

    return <QRScanner initialError="QR code inconnu." />;
  }

  return <QRScanner />;
}
