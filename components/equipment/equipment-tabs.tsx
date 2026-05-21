"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type TabKey = "historique" | "photos" | "plannings";

interface EquipmentTabsProps {
  tasks: Array<{
    id: string;
    datePrevue: Date | string;
    statut: string;
    planningType: string;
    rapportId: string | null;
  }>;
  photos: Array<{
    id: string;
    url: string;
  }>;
  plannings: Array<{
    id: string;
    type: string;
    periodicite: string;
    technicienNom: string | null;
    nuit: boolean;
  }>;
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "historique", label: "Historique des maintenances" },
  { key: "photos", label: "Photos" },
  { key: "plannings", label: "Plannings actifs" },
];

export function EquipmentTabs({ tasks, photos, plannings }: EquipmentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("historique");

  const counters = useMemo(
    () => ({
      historique: tasks.length,
      photos: photos.length,
      plannings: plannings.length,
    }),
    [photos.length, plannings.length, tasks.length],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-3xl border border-border bg-white p-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? "rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
                : "rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:bg-primary-soft"
            }
          >
            {tab.label} ({counters[tab.key]})
          </button>
        ))}
      </div>

      {activeTab === "historique" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <article key={task.id} className="card space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-bold">{task.planningType.replaceAll("_", " ")}</p>
                    <p className="text-sm text-muted">{formatDate(task.datePrevue)}</p>
                  </div>
                  <Badge value={task.statut} />
                </div>
                <p className="text-sm text-muted">
                  {task.rapportId ? "Rapport d'intervention disponible." : "Aucun rapport associe pour le moment."}
                </p>
              </article>
            ))
          ) : (
            <div className="card text-sm text-muted">Aucune intervention historique enregistree.</div>
          )}
        </div>
      ) : null}

      {activeTab === "photos" ? (
        photos.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-3xl border border-border bg-white p-2">
                <img
                  src={photo.url}
                  alt="Photo equipement"
                  className="h-44 w-full rounded-2xl object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-sm text-muted">Aucune photo disponible pour cet equipement.</div>
        )
      ) : null}

      {activeTab === "plannings" ? (
        plannings.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {plannings.map((planning) => (
              <article key={planning.id} className="card space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-bold">{planning.type.replaceAll("_", " ")}</p>
                    <p className="text-sm text-muted">{planning.periodicite.replaceAll("_", " ")}</p>
                  </div>
                  {planning.nuit ? (
                    <Badge label="Nuit" className="bg-slate-900 text-white" />
                  ) : (
                    <Badge label="Jour" className="bg-slate-100 text-slate-700" />
                  )}
                </div>
                <p className="text-sm text-muted">
                  {planning.technicienNom || "Aucun technicien assigne"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="card text-sm text-muted">Aucun planning actif pour cet equipement.</div>
        )
      ) : null}
    </section>
  );
}
