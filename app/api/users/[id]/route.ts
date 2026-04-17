import bcrypt from "bcryptjs";

import { apiError, apiOk, parseJsonBody, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { UpdateUserSchema } from "@/lib/validations/user";

function sanitizeUser<T extends { passwordHash: string }>(user: T) {
  const safeUser = { ...user };
  Reflect.deleteProperty(safeUser, "passwordHash");
  return safeUser;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const { id } = await params;
  const isAdmin = sessionResult.session.user.role === "ADMIN";
  const isSelf = sessionResult.session.user.id === id;

  if (!isAdmin && !isSelf) {
    return apiError("Vous n'avez pas les droits necessaires.", "FORBIDDEN", 403);
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { service: true },
  });

  if (!user) {
    return apiError("Utilisateur introuvable.", "USER_NOT_FOUND", 404);
  }

  return apiOk(sanitizeUser(user));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  if (sessionResult.session.user.role !== "ADMIN") {
    return apiError("Vous n'avez pas les droits necessaires.", "FORBIDDEN", 403);
  }

  const bodyResult = await parseJsonBody(request, UpdateUserSchema);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const { id } = await params;
  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    return apiError("Utilisateur introuvable.", "USER_NOT_FOUND", 404);
  }

  const passwordHash = bodyResult.data.password
    ? await bcrypt.hash(bodyResult.data.password, 12)
    : undefined;

  const user = await prisma.user.update({
    where: { id },
    data: {
      nom: bodyResult.data.nom,
      prenom: bodyResult.data.prenom,
      email: bodyResult.data.email?.toLowerCase(),
      role: bodyResult.data.role,
      serviceId: bodyResult.data.serviceId === undefined ? undefined : bodyResult.data.serviceId || null,
      actif: bodyResult.data.actif,
      ...(passwordHash ? { passwordHash } : {}),
    },
    include: {
      service: true,
    },
  });

  return apiOk(sanitizeUser(user));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  if (sessionResult.session.user.role !== "ADMIN") {
    return apiError("Vous n'avez pas les droits necessaires.", "FORBIDDEN", 403);
  }

  const { id } = await params;
  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    return apiError("Utilisateur introuvable.", "USER_NOT_FOUND", 404);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { actif: false },
    include: { service: true },
  });

  return apiOk(sanitizeUser(user));
}
