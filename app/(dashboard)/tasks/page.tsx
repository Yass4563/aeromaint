import { Role, TaskStatut } from "@prisma/client";

import { SubmittedTasksBoard } from "@/components/tasks/submitted-tasks-board";
import { TaskFeed } from "@/components/tasks/task-feed";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const params = (await searchParams) || {};
  const openTask = typeof params.openTask === "string" ? params.openTask : undefined;

  if (!session?.user) {
    return null;
  }

  if (session.user.role === Role.TECHNICIEN) {
    const [enRetard, aujourdHui, aVenir] = await Promise.all([
      prisma.task.findMany({
        where: {
          technicienId: session.user.id,
          statut: { in: [TaskStatut.OUVERTE, TaskStatut.REJETEE] },
          datePrevue: { lt: new Date() },
        },
        include: { equipement: true, planning: true },
        orderBy: { datePrevue: "asc" },
      }),
      prisma.task.findMany({
        where: {
          technicienId: session.user.id,
          datePrevue: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        include: { equipement: true, planning: true },
        orderBy: { datePrevue: "asc" },
      }),
      prisma.task.findMany({
        where: {
          technicienId: session.user.id,
          datePrevue: { gt: new Date(new Date().setHours(23, 59, 59, 999)) },
        },
        include: { equipement: true, planning: true },
        orderBy: { datePrevue: "asc" },
        take: 7,
      }),
    ]);

    return (
      <TaskFeed
        groups={{
          enRetard,
          aujourdHui,
          aVenir,
        }}
        initialOpenTaskId={openTask}
      />
    );
  }

  const items = await prisma.task.findMany({
    where: { statut: TaskStatut.SOUMISE },
    include: {
      equipement: {
        include: {
          famille: true,
          zone: true,
        },
      },
      planning: true,
      technicien: true,
      rapport: {
        include: {
          photos: true,
        },
      },
    },
    orderBy: { soumisLe: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Taches a valider</h1>
        <p className="mt-2 text-sm text-muted">
          Validation superviseur des rapports d&apos;intervention soumis.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card bg-gradient-to-br from-white to-amber-50">
          <p className="text-sm text-muted">Soumissions en attente</p>
          <p className="mt-3 text-3xl font-black">{items.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-primary-soft/40">
          <p className="text-sm text-muted">Equipements concernes</p>
          <p className="mt-3 text-3xl font-black">{new Set(items.map((item) => item.equipement.id)).size}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-teal-50">
          <p className="text-sm text-muted">Techniciens engages</p>
          <p className="mt-3 text-3xl font-black">
            {new Set(items.map((item) => item.technicien?.id).filter(Boolean)).size}
          </p>
        </div>
      </div>
      <SubmittedTasksBoard items={items} />
    </div>
  );
}
