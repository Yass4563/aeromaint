const QR_TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_QR_TOKEN_LENGTH = 128;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function isValidQrToken(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_QR_TOKEN_LENGTH &&
    QR_TOKEN_PATTERN.test(value)
  );
}

export function buildEquipmentScanUrl(qrCode: string, baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/tasks/scan?qr=${encodeURIComponent(qrCode)}`;
}

export function normalizeQrCodeValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const candidates = [trimmed];

  try {
    const url = new URL(trimmed, "http://aeromaint.local");
    const qrParam = url.searchParams.get("qr");

    if (qrParam) {
      candidates.unshift(qrParam.trim());
    }
  } catch {
    // Non-URL values are handled as direct QR tokens below.
  }

  for (const candidate of candidates) {
    try {
      const decoded = decodeURIComponent(candidate).trim();

      if (isValidQrToken(decoded)) {
        return decoded;
      }
    } catch {
      if (isValidQrToken(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}
