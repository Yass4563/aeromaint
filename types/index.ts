import {
  EquipementStatut,
  MaintenanceType,
  Periodicite,
  Role,
  TaskStatut,
} from "@prisma/client";

export interface ApiErrorResponse {
  erreur: string;
  code: string;
}

export interface AuthUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
}

export interface NotificationItem {
  id: string;
  titre: string;
  datePrevue: string;
  statut: TaskStatut;
  equipementNom: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface KPIFilterFormValues {
  dateDebut: string;
  dateFin: string;
  serviceId?: string;
  familleId?: string;
  technicienId?: string;
  equipementId?: string;
  periodicite?: Periodicite;
  type?: MaintenanceType;
  nuit?: boolean;
}

export interface EquipmentFilterValues {
  search?: string;
  familleId?: string;
  zoneId?: string;
  serviceId?: string;
  statut?: EquipementStatut;
  enService?: boolean;
  page?: number;
  limit?: number;
}
