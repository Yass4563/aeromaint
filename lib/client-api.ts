interface ApiErrorPayload {
  erreur?: string;
  details?: Record<string, string[] | undefined>;
}

export async function getApiErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;

    const firstFieldError = payload.details
      ? Object.values(payload.details).flat().find(Boolean)
      : undefined;

    return firstFieldError || payload.erreur || fallback;
  } catch {
    return fallback;
  }
}
