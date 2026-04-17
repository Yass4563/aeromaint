import { MaintenanceType, Periodicite } from "@prisma/client";
import { z } from "zod";

export const PlanningSchema = z.object({
  equipementId: z.string().uuid(),
  type: z.nativeEnum(MaintenanceType),
  periodicite: z.nativeEnum(Periodicite),
  dateDebut: z.coerce.date(),
  eviterWeekend: z.boolean().optional(),
  nuit: z.boolean().optional(),
  technicienId: z.string().uuid().optional().nullable(),
  actif: z.boolean().optional(),
});

export const PlanningUpdateSchema = PlanningSchema.partial().extend({
  equipementId: z.string().uuid().optional(),
});
