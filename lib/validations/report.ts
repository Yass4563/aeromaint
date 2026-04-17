import { z } from "zod";

export const ReportSchema = z.object({
  taskId: z.string().uuid(),
  description: z.string().trim().min(1, "La description est obligatoire."),
  dateIntervention: z.coerce.date(),
  photoUrls: z.array(z.string().min(1)).default([]),
});
