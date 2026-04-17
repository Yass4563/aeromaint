import { redirect } from "next/navigation";

import { QRScanner } from "@/components/tasks/qr-scanner";
import { prisma } from "@/lib/prisma";

export default async function TaskScanPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const qr = typeof params.qr === "string" ? params.qr : undefined;

  if (qr) {
    const equipement = await prisma.equipement.findUnique({
      where: { qrCode: qr },
    });

    if (equipement) {
      const task = await prisma.task.findFirst({
        where: {
          equipementId: equipement.id,
          statut: "OUVERTE",
        },
        orderBy: { datePrevue: "desc" },
      });

      if (task) {
        redirect(`/tasks?openTask=${task.id}`);
      }
    }
  }

  return <QRScanner />;
}
