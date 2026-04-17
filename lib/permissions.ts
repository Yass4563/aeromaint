import { Role } from "@prisma/client";

export type Permission =
  | "equipement:read"
  | "equipement:write"
  | "equipement:delete"
  | "planning:read"
  | "planning:write"
  | "planning:delete"
  | "task:read"
  | "task:write"
  | "task:submit"
  | "task:validate"
  | "task:assign"
  | "rapport:read"
  | "rapport:write"
  | "kpi:read"
  | "kpi:read:own"
  | "user:read"
  | "user:write"
  | "qr:generate";

const ALL_PERMISSIONS: Permission[] = [
  "equipement:read",
  "equipement:write",
  "equipement:delete",
  "planning:read",
  "planning:write",
  "planning:delete",
  "task:read",
  "task:write",
  "task:submit",
  "task:validate",
  "task:assign",
  "rapport:read",
  "rapport:write",
  "kpi:read",
  "kpi:read:own",
  "user:read",
  "user:write",
  "qr:generate",
];

export const PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  SUPERVISEUR: [
    "equipement:read",
    "planning:read",
    "planning:write",
    "task:read",
    "task:validate",
    "task:assign",
    "rapport:read",
    "kpi:read",
    "user:read",
  ],
  TECHNICIEN: [
    "equipement:read",
    "task:read",
    "task:submit",
    "rapport:write",
    "kpi:read:own",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
