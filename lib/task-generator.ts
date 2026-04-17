import { Periodicite, TaskStatut } from "@prisma/client";
import { addDays, addMonths } from "date-fns";

import { prisma } from "@/lib/prisma";

function adjustWeekend(date: Date, eviterWeekend: boolean): Date {
  if (!eviterWeekend) {
    return date;
  }

  const day = date.getDay();

  if (day === 6) {
    return addDays(date, 2);
  }

  if (day === 0) {
    return addDays(date, 1);
  }

  return date;
}

function getNextDate(current: Date, periodicite: Periodicite): Date {
  switch (periodicite) {
    case Periodicite.HEBDOMADAIRE:
      return addDays(current, 7);
    case Periodicite.MENSUELLE:
      return addMonths(current, 1);
    case Periodicite.TRIMESTRIELLE:
      return addMonths(current, 3);
    case Periodicite.SEMESTRIELLE:
      return addMonths(current, 6);
    case Periodicite.ANNUELLE:
      return addMonths(current, 12);
    default:
      return current;
  }
}

export function generateTaskDates(
  dateDebut: Date,
  periodicite: Periodicite,
  eviterWeekend: boolean,
  monthsAhead = 12,
): Date[] {
  const dates: Date[] = [];
  const endDate = addMonths(dateDebut, monthsAhead);
  let cursor = new Date(dateDebut);

  while (cursor <= endDate) {
    dates.push(adjustWeekend(new Date(cursor), eviterWeekend));
    cursor = getNextDate(cursor, periodicite);
  }

  return dates;
}

export async function generateTasksForPlanning(planningId: string): Promise<void> {
  const planning = await prisma.planning.findUnique({
    where: { id: planningId },
    include: { equipement: true },
  });

  if (!planning) {
    return;
  }

  await prisma.task.deleteMany({
    where: {
      planningId,
      statut: TaskStatut.OUVERTE,
    },
  });

  if (!planning.actif) {
    return;
  }

  const dates = generateTaskDates(
    planning.dateDebut,
    planning.periodicite,
    planning.eviterWeekend,
  );

  if (dates.length === 0) {
    return;
  }

  await prisma.task.createMany({
    data: dates.map((datePrevue) => ({
      planningId: planning.id,
      equipementId: planning.equipementId,
      technicienId: planning.technicienId,
      datePrevue,
      statut: TaskStatut.OUVERTE,
    })),
  });
}
