import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodType } from "zod";

import { auth } from "@/lib/auth";
import { Permission, hasPermission } from "@/lib/permissions";

export function apiError(
  erreur: string,
  code: string,
  status: number,
): NextResponse {
  return NextResponse.json({ erreur, code }, { status });
}

export function apiOk<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

export function parseBoolean(value: string | null): boolean | undefined {
  if (value === null || value === "") {
    return undefined;
  }

  if (value === "true" || value === "1") {
    return true;
  }

  if (value === "false" || value === "0") {
    return false;
  }

  return undefined;
}

export function parsePositiveInt(
  value: string | null,
  fallback: number,
  max?: number,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  if (max && parsed > max) {
    return max;
  }

  return Math.floor(parsed);
}

export function getSearchParams(request: Request): URLSearchParams {
  return new URL(request.url).searchParams;
}

export async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    return {
      response: apiError("Authentification requise.", "AUTH_REQUIRED", 401),
    };
  }

  return { session };
}

export async function requirePermission(permission: Permission) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult;
  }

  if (!hasPermission(sessionResult.session.user.role, permission)) {
    return {
      response: apiError(
        "Vous n'avez pas les droits necessaires.",
        "FORBIDDEN",
        403,
      ),
    };
  }

  return sessionResult;
}

export function assertRole(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role);
}

export function validationError(error: Record<string, string[]>) {
  return NextResponse.json(
    {
      erreur: "Les donnees transmises sont invalides.",
      code: "VALIDATION_ERROR",
      details: error,
    },
    { status: 400 },
  );
}

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<
  | { success: true; data: T }
  | { success: false; response: NextResponse }
> {
  try {
    const json = await request.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return {
        success: false,
        response: validationError(
          Object.fromEntries(
            Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => [
              key,
              value ?? [],
            ]),
          ) as Record<string, string[]>,
        ),
      };
    }

    return { success: true, data: parsed.data };
  } catch {
    return {
      success: false,
      response: apiError("Corps de requete invalide.", "INVALID_JSON", 400),
    };
  }
}

export function normalizeDateRange(
  dateDebut?: Date | null,
  dateFin?: Date | null,
): { gte?: Date; lte?: Date } | undefined {
  if (!dateDebut && !dateFin) {
    return undefined;
  }

  return {
    ...(dateDebut ? { gte: dateDebut } : {}),
    ...(dateFin ? { lte: dateFin } : {}),
  };
}
