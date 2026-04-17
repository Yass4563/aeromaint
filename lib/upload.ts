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
  const extension = ALLOWED_TYPES.get(file.type);

  if (!extension) {
    throw new Error("TYPE_NOT_ALLOWED");
  }

  const relativeDirectory = path.join(uploadRoot, year, month);
  const absoluteDirectory = path.join(process.cwd(), relativeDirectory);

  await mkdir(absoluteDirectory, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const absolutePath = path.join(absoluteDirectory, filename);
  const arrayBuffer = await file.arrayBuffer();

  await writeFile(absolutePath, Buffer.from(arrayBuffer));

  return `/${relativeDirectory.replace(/^public[\\/]/, "").replace(/\\/g, "/")}/${filename}`;
}
