import { endOfMonth, startOfMonth } from "date-fns";
import { Role, TaskStatut } from "@prisma/client";

import { TaskFeed } from "@/components/tasks/task-feed";
import { Badge } from "@/components/ui/badge";
import { calculateKPI } from "@/lib/kpi";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  if (session.user.role === Role.TECHNICIEN) {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
    const actionableStatuses = [TaskStatut.OUVERTE, TaskStatut.REJETEE, TaskStatut.SOUMISE];
    const [enRetard, aujourdHui, aVenir] = await Promise.all([
      prisma.task.findMany({
        where: {
          technicienId: session.user.id,
          statut: { in: [TaskStatut.OUVERTE, TaskStatut.REJETEE] },
          datePrevue: { lt: todayStart },
        },
        include: { equipement: true, planning: true },
        orderBy: { datePrevue: "asc" },
      }),
      prisma.task.findMany({
        where: {
          technicienId: session.user.id,
          statut: { in: actionableStatuses },
          datePrevue: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: { equipement: true, planning: true },
        orderBy: { datePrevue: "asc" },
        take: 5,
      }),
      prisma.task.findMany({
        where: {
          technicienId: session.user.id,
          statut: { in: actionableStatuses },
          datePrevue: { gt: todayEnd },
        },
        include: { equipement: true, planning: true },
        orderBy: { datePrevue: "asc" },
        take: 5,
      }),
    ]);

    return (
      <TaskFeed
        groups={{
          enRetard,
          aujourdHui,
          aVenir,
        }}
      />
    );
  }

  const [equipmentCount, tasksToday, pendingValidations, monthlyKpi, latestSubmitted] =
    await Promise.all([
      prisma.equipement.count(),
      prisma.task.count({
        where: {
          datePrevue: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.task.count({
        where: { statut: TaskStatut.SOUMISE },
      }),
      calculateKPI({
        dateDebut: startOfMonth(new Date()),
        dateFin: endOfMonth(new Date()),
      }),
      prisma.task.findMany({
        where: { statut: TaskStatut.SOUMISE },
        include: { equipement: true, technicien: true },
        orderBy: { soumisLe: "asc" },
        take: 6,
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Tableau de bord</h1>
        <p className="mt-2 text-sm text-muted">
          Vue d&apos;ensemble de l&apos;activite preventive sur le site ESU.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-sm text-muted">Total equipements</p>
          <p className="mt-3 text-3xl font-black">{equipmentCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Taches aujourd&apos;hui</p>
          <p className="mt-3 text-3xl font-black">{tasksToday}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Validations en attente</p>
          <p className="mt-3 text-3xl font-black">{pendingValidations}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Taux de realisation ce mois</p>
          <p className="mt-3 text-3xl font-black">{monthlyKpi.tauxRealisation}%</p>
        </div>
      </div>
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Taches soumises recentes</h2>
          <Badge label={`${latestSubmitted.length}`} />
        </div>
        <div className="space-y-3">
          {latestSubmitted.map((task) => (
            <div key={task.id} className="flex items-center justify-between rounded-2xl bg-primary-soft/40 px-4 py-3">
              <div>
                <p className="font-semibold">{task.equipement.nom}</p>
                <p className="text-sm text-muted">
                  {task.technicien ? `${task.technicien.prenom} ${task.technicien.nom}` : "Non assigne"}
                </p>
              </div>
              <Badge value={task.statut} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
