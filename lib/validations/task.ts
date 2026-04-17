import { TaskStatut } from "@prisma/client";
import { z } from "zod";

export const TaskUpdateSchema = z.object({
  statut: z.nativeEnum(TaskStatut).optional(),
  technicienId: z.string().uuid().optional().nullable(),
});

export const TaskValidationSchema = z.object({
  commentaire: z.string().trim().max(5000).optional(),
});

export const TaskRejectionSchema = z.object({
  commentaire: z.string().trim().min(1, "Le commentaire est obligatoire."),
});
