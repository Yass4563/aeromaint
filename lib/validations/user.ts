import { Role } from "@prisma/client";
import { z } from "zod";

export const CreateUserSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire."),
  prenom: z.string().trim().min(1, "Le prenom est obligatoire."),
  email: z.string().trim().email("Adresse email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
  role: z.nativeEnum(Role),
  serviceId: z.string().uuid().optional().nullable(),
  actif: z.boolean().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  role: z.nativeEnum(Role).optional(),
});
