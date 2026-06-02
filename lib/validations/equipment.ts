import { EquipementStatut } from "@prisma/client";
import { z } from "zod";

export const CreateEquipementSchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire."),
  code: z.string().trim().optional().or(z.literal("")),
  marque: z.string().trim().optional().or(z.literal("")),
  numeroSerie: z.string().trim().optional().or(z.literal("")),
  familleId: z.string().uuid("La famille est invalide."),
  zoneId: z.string().uuid("La zone est invalide."),
  serviceId: z.string().uuid("Le service est invalide."),
  statut: z.nativeEnum(EquipementStatut).default(EquipementStatut.EN_SERVICE),
  qrAppose: z.boolean().optional(),
  miseEnService: z.coerce.date().optional(),
  remplacementPrevu: z.coerce.date().optional(),
  dateArret: z.coerce.date().optional(),
  prixAcquisition: z.coerce.number().nonnegative().optional(),
  modeIntegre: z.boolean().optional(),
  remarques: z.string().trim().optional().or(z.literal("")),
});

export const UpdateEquipementSchema = CreateEquipementSchema.extend({
  statut: z.nativeEnum(EquipementStatut).optional(),
});
