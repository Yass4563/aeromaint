import { apiError, apiOk, requireSession } from "@/lib/api";
import { saveUploadedImage } from "@/lib/upload";

export async function POST(request: Request) {
  const sessionResult = await requireSession();

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const formData = await request.formData();
  const files = formData.getAll("files");

  if (files.length === 0) {
    return apiError("Aucun fichier n'a ete transmis.", "NO_FILE", 400);
  }

  try {
    const saved = await Promise.all(
      files.map(async (entry) => {
        if (!(entry instanceof File)) {
          throw new Error("INVALID_FILE");
        }

        const url = await saveUploadedImage(entry);
        return { url };
      }),
    );

    if (saved.length === 1) {
      return apiOk(saved[0], { status: 201 });
    }

    return apiOk({ fichiers: saved }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "TYPE_NOT_ALLOWED") {
      return apiError(
        "Seuls les fichiers JPG, PNG et WEBP sont autorises.",
        "TYPE_NOT_ALLOWED",
        400,
      );
    }

    if (error instanceof Error && error.message === "FILE_TOO_LARGE") {
      return apiError(
        "La taille maximale autorisee est de 5 Mo.",
        "FILE_TOO_LARGE",
        400,
      );
    }

    return apiError("Impossible de televerser le fichier.", "UPLOAD_FAILED", 500);
  }
}
