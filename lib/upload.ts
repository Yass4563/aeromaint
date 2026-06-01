import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function isAllowedImageType(contentType: string): boolean {
  return ALLOWED_TYPES.has(contentType);
}

function detectImageExtension(buffer: Buffer): "jpg" | "png" | "webp" | undefined {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "jpg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  return undefined;
}

export async function saveUploadedImage(file: File): Promise<string> {
  if (!isAllowedImageType(file.type)) {
    throw new Error("TYPE_NOT_ALLOWED");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("FILE_TOO_LARGE");
  }

  const uploadRoot = process.env.UPLOAD_DIR || "public/uploads";
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extension = detectImageExtension(buffer);

  if (!extension || extension !== ALLOWED_TYPES.get(file.type)) {
    throw new Error("TYPE_NOT_ALLOWED");
  }

  const relativeDirectory = path.join(uploadRoot, year, month);
  const absoluteDirectory = path.join(process.cwd(), relativeDirectory);

  await mkdir(absoluteDirectory, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const absolutePath = path.join(absoluteDirectory, filename);

  await writeFile(absolutePath, buffer);

  return `/${relativeDirectory.replace(/^public[\\/]/, "").replace(/\\/g, "/")}/${filename}`;
}
