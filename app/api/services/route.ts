import { z } from "zod";

import { apiError, apiOk, parseJsonBody, requireSession, validationError } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  nom: z.string().trim().min(1, "Le nom est obligatoire."),
});

export async function GET() {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const services = await prisma.service.findMany({
    orderBy: { nom: "asc" },
  });

  return apiOk(services);
}

export async function POST(request: Request) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  if (!hasPermission(sessionResult.session.user.role, "equipement:write")) {
    return apiError("Vous n'avez pas les droits necessaires.", "FORBIDDEN", 403);
  }

  const bodyResult = await parseJsonBody(request, schema);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const existing = await prisma.service.findFirst({
    where: {
      nom: {
        equals: bodyResult.data.nom,
      },
    },
  });

  if (existing) {
    return validationError({ nom: ["Ce service existe deja."] });
  }

  const service = await prisma.service.create({
    data: bodyResult.data,
  });

  return apiOk(service, { status: 201 });
}
