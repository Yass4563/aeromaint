"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: string;
    statut: string;
    datePrevue: Date | string;
    planning: { type: string };
    equipement: { nom: string; statut: string };
  };
  onOpen: (id: string) => void;
}

export function TaskCard({ task, onOpen }: TaskCardProps) {
  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <p className="text-lg font-semibold">{task.equipement.nom}</p>
          <Badge value={task.equipement.statut} />
        </div>
        <p className="text-sm text-muted">{task.planning.type}</p>
        <p className="text-sm text-muted">Date prevue : {formatDate(task.datePrevue)}</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge value={task.statut} />
        <Button onClick={() => onOpen(task.id)}>Ouvrir</Button>
      </div>
    </div>
  );
}
