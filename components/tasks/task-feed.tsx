"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { MaintenanceForm } from "@/components/tasks/maintenance-form";
import { TaskCard } from "@/components/tasks/task-card";

interface TaskItem {
  id: string;
  statut: string;
  datePrevue: string | Date;
  planning: { type: string };
  equipement: { nom: string; statut: string };
}

export function TaskFeed({
  groups,
  initialOpenTaskId,
}: {
  groups: {
    enRetard: TaskItem[];
    aujourdHui: TaskItem[];
    aVenir: TaskItem[];
  };
  initialOpenTaskId?: string;
}) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(initialOpenTaskId || null);
  const closeTask = useCallback(() => setActiveTaskId(null), []);

  useEffect(() => {
    if (initialOpenTaskId) {
      setActiveTaskId(initialOpenTaskId);
    }
  }, [initialOpenTaskId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Taches du jour</h1>
          <p className="mt-2 text-sm text-muted">
            Retrouvez vos interventions en retard, prevues aujourd&apos;hui et a venir.
          </p>
        </div>
        <Link
          href="/tasks/scan"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          Scanner un QR
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card bg-gradient-to-br from-white to-red-50">
          <p className="text-sm text-muted">En retard</p>
          <p className="mt-3 text-3xl font-black text-danger">{groups.enRetard.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-primary-soft/40">
          <p className="text-sm text-muted">Aujourd&apos;hui</p>
          <p className="mt-3 text-3xl font-black">{groups.aujourdHui.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-amber-50">
          <p className="text-sm text-muted">A venir</p>
          <p className="mt-3 text-3xl font-black">{groups.aVenir.length}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-danger">EN RETARD</h2>
        {groups.enRetard.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={setActiveTaskId} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">AUJOURD&apos;HUI</h2>
        {groups.aujourdHui.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={setActiveTaskId} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">A VENIR</h2>
        {groups.aVenir.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={setActiveTaskId} />
        ))}
      </section>

      <MaintenanceForm taskId={activeTaskId} open={Boolean(activeTaskId)} onClose={closeTask} />
    </div>
  );
}
