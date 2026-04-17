import {
  MaintenanceType,
  Periodicite,
  Prisma,
  TaskStatut,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { roundPercentage } from "@/lib/utils";

export interface KPIFilters {
  dateDebut: Date;
  dateFin: Date;
  serviceId?: string;
  familleId?: string;
  technicienId?: string;
  equipementId?: string;
  periodicite?: Periodicite;
  type?: MaintenanceType;
  nuit?: boolean;
}

export interface KPIResult {
  actionsPlanifiees: number;
  actionsRealisees: number;
  actionsEnAttente: number;
  tauxRealisation: number;
  actionsARespect: number;
  tauxRespect: number;
}

function buildWhere(filters: KPIFilters): Prisma.TaskWhereInput {
  return {
    datePrevue: {
      gte: filters.dateDebut,
      lte: filters.dateFin,
    },
    ...(filters.technicienId ? { technicienId: filters.technicienId } : {}),
    ...(filters.equipementId ? { equipementId: filters.equipementId } : {}),
    equipement: {
      ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
      ...(filters.familleId ? { familleId: filters.familleId } : {}),
    },
    planning: {
      ...(filters.periodicite ? { periodicite: filters.periodicite } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.nuit !== undefined ? { nuit: filters.nuit } : {}),
    },
  };
}

export async function calculateKPI(filters: KPIFilters): Promise<KPIResult> {
  const baseWhere = buildWhere(filters);

  const actionsPlanifiees = await prisma.task.count({
    where: baseWhere,
  });

  const actionsRealisees = await prisma.task.count({
    where: {
      ...baseWhere,
      statut: {
        in: [TaskStatut.VALIDEE, TaskStatut.CLOTUREE],
      },
    },
  });

  const completedTasks = await prisma.task.findMany({
    where: {
      ...baseWhere,
      statut: {
        in: [TaskStatut.VALIDEE, TaskStatut.CLOTUREE],
      },
      valideLe: {
        not: null,
      },
    },
    select: {
      datePrevue: true,
      valideLe: true,
    },
  });

  const actionsARespect = completedTasks.filter((task) => {
    return task.valideLe !== null && task.valideLe <= task.datePrevue;
  }).length;

  const actionsEnAttente = actionsPlanifiees - actionsRealisees;

  return {
    actionsPlanifiees,
    actionsRealisees,
    actionsEnAttente,
    tauxRealisation:
      actionsPlanifiees === 0
        ? 0
        : roundPercentage((actionsRealisees / actionsPlanifiees) * 100),
    actionsARespect,
    tauxRespect:
      actionsPlanifiees === 0
        ? 0
        : roundPercentage((actionsARespect / actionsPlanifiees) * 100),
  };
}
