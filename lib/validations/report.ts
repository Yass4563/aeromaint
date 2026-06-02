import { EquipementStatut } from "@prisma/client";
import { z } from "zod";

const UploadedPhotoUrlSchema = z.string().regex(
  /^\/uploads\/(?:(?:\d{4}\/\d{2}\/[0-9a-f-]{36})|(?:presentation\/[a-z0-9-]+))\.(jpg|png)$/i,
  "L'URL de photo est invalide.",
);

export const ReportSchema = z.object({
  taskId: z.string().uuid(),
  description: z.string().trim().min(1, "La description est obligatoire."),
  dateIntervention: z.coerce.date(),
  equipementStatut: z.enum([
    EquipementStatut.EN_SERVICE,
    EquipementStatut.EN_PANNE,
  ]),
  photoUrls: z.array(UploadedPhotoUrlSchema).max(8).default([]),
});
