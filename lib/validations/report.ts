import { z } from "zod";

const UploadedPhotoUrlSchema = z.string().regex(
  /^\/uploads\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp)$/i,
  "L'URL de photo est invalide.",
);

export const ReportSchema = z.object({
  taskId: z.string().uuid(),
  description: z.string().trim().min(1, "La description est obligatoire."),
  dateIntervention: z.coerce.date(),
  photoUrls: z.array(UploadedPhotoUrlSchema).max(8).default([]),
});
