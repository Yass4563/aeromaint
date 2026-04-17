import { Prisma, Role, TaskStatut } from "@prisma/client";
import { addDays, endOfDay, startOfDay } from "date-fns";

import { apiOk, getSearchParams, parseBoolean, requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";

function buildBaseWhere(
  params: URLSearchParams,
  userId: string,
  role: Role,
): Prisma.TaskWhereInput {
  const technicienId =
    role === "TECHNICIEN" ? userId : params.get("technicienId") || undefined;
  const statut = params.get("statut") || undefined;
  const equipementId = params.get("equipementId") || undefined;
  const overdue = parseBoolean(params.get("overdue"));
  const dateDebut = params.get("dateDebut");
  const dateFin = params.get("dateFin");

  return {
    ...(technicienId ? { technicienId } : {}),
    ...(statut ? { statut: statut as TaskStatut } : {}),
    ...(equipementId ? { equipementId } : {}),
    ...(dateDebut || dateFin
      ? {
          datePrevue: {
            ...(dateDebut ? { gte: new Date(dateDebut) } : {}),
            ...(dateFin ? { lte: new Date(dateFin) } : {}),
          },
        }
      : {}),
    ...(overdue
      ? {
          statut: TaskStatut.OUVERTE,
          datePrevue: {
            lt: new Date(),
          },
        }
      : {}),
  };
}

export async function GET(request: Request) {
  const sessionResult = await requirePermission("task:read");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const params = getSearchParams(request as Request & { url: string });
  const vue = params.get("vue");
  const { id: userId, role } = sessionResult.session.user;

  if (vue === "today") {
    if (role === "SUPERVISEUR" || role === "ADMIN") {
      const aValider = await prisma.task.findMany({
        where: {
          statut: TaskStatut.SOUMISE,
        },
        include: {
          equipement: true,
          planning: true,
          technicien: true,
        },
        orderBy: { soumisLe: "asc" },
      });

      return apiOk({
        aValider,
        total: aValider.length,
      });
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const nextWeek = endOfDay(addDays(new Date(), 7));
    const technicianWhere: Prisma.TaskWhereInput = {
      technicienId: userId,
      statut: {
        in: [TaskStatut.OUVERTE, TaskStatut.REJETEE, TaskStatut.SOUMISE],
      },
    };

    const tasks = await prisma.task.findMany({
      where: {
        ...technicianWhere,
        datePrevue: {
          lte: nextWeek,
        },
      },
      include: {
        equipement: {
          include: {
            famille: true,
            zone: true,
          },
        },
        planning: true,
        rapport: {
          select: { id: true },
        },
      },
      orderBy: { datePrevue: "asc" },
    });

    return apiOk({
      enRetard: tasks.filter(
        (task) =>
          task.datePrevue < todayStart &&
          (task.statut === TaskStatut.OUVERTE || task.statut === TaskStatut.REJETEE),
      ),
      aujourdHui: tasks.filter(
        (task) => task.datePrevue >= todayStart && task.datePrevue <= todayEnd,
      ),
      aVenir: tasks.filter(
        (task) => task.datePrevue > todayEnd && task.datePrevue <= nextWeek,
      ),
    });
  }

  const where = buildBaseWhere(params, userId, role);
  const tasks = await prisma.task.findMany({
    where,
    include: {
      equipement: {
        select: {
          id: true,
          nom: true,
          statut: true,
          famille: true,
          zone: true,
        },
      },
      planning: {
        select: {
          id: true,
          type: true,
          periodicite: true,
          nuit: true,
        },
      },
      rapport: {
        select: {
          id: true,
        },
      },
      technicien: true,
    },
    orderBy: { datePrevue: "asc" },
  });

  return apiOk(tasks);
}
