import bcrypt from "bcryptjs";

import { apiError, apiOk, parseJsonBody, requirePermission } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { CreateUserSchema } from "@/lib/validations/user";

export async function GET() {
  const sessionResult = await requirePermission("user:read");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  if (sessionResult.session.user.role !== "ADMIN") {
    return apiError("Vous n'avez pas les droits necessaires.", "FORBIDDEN", 403);
  }

  const users = await prisma.user.findMany({
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    include: {
      service: true,
    },
  });

  return apiOk(
    users.map((user) => {
      const safeUser = { ...user };
      Reflect.deleteProperty(safeUser, "passwordHash");
      return safeUser;
    }),
  );
}

export async function POST(request: Request) {
  const sessionResult = await requirePermission("user:write");

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  if (sessionResult.session.user.role !== "ADMIN") {
    return apiError("Vous n'avez pas les droits necessaires.", "FORBIDDEN", 403);
  }

  const bodyResult = await parseJsonBody(request, CreateUserSchema);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const existing = await prisma.user.findUnique({
    where: { email: bodyResult.data.email.toLowerCase() },
  });

  if (existing) {
    return apiError("Cette adresse email est deja utilisee.", "USER_EXISTS", 400);
  }

  const passwordHash = await bcrypt.hash(bodyResult.data.password, 12);
  const user = await prisma.user.create({
    data: {
      nom: bodyResult.data.nom,
      prenom: bodyResult.data.prenom,
      email: bodyResult.data.email.toLowerCase(),
      passwordHash,
      role: bodyResult.data.role,
      serviceId: bodyResult.data.serviceId || null,
      actif: bodyResult.data.actif ?? true,
    },
    include: {
      service: true,
    },
  });

  const safeUser = { ...user };
  Reflect.deleteProperty(safeUser, "passwordHash");
  return apiOk(safeUser, { status: 201 });
}
