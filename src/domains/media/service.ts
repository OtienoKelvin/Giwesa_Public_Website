import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { env } from "@/config/env";
import { prisma } from "@/db/client";
import { ValidationError } from "@/lib/errors";

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);

export type SavedCover = { url: string; fileName: string; width: number; height: number };

export async function saveBlogCover(
  file: File,
  altText: string,
  adminId: string,
): Promise<SavedCover> {
  if (!file || file.size === 0) {
    throw new ValidationError("Choose an image to upload.");
  }
  if (file.size > env.MEDIA_MAX_BYTES) {
    throw new ValidationError(
      `The image is too large. The maximum is ${Math.floor(env.MEDIA_MAX_BYTES / 1024 / 1024)} MB.`,
    );
  }
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
    throw new ValidationError("Upload a JPEG, PNG, WebP or AVIF image.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let processed: {
    data: Buffer;
    info: { width: number; height: number };
    format: string | undefined;
  };
  try {
    const pipeline = sharp(buffer, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    });
    const metadata = await pipeline.metadata();
    if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
      throw new Error("Unsupported image format");
    }
    const output = await pipeline
      .rotate()
      .resize({
        width: 1600,
        height: 1000,
        fit: "cover",
        position: "attention",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    processed = { data: output.data, info: output.info, format: metadata.format };
  } catch {
    throw new ValidationError("That image could not be read. Try a different image.");
  }

  const id = randomUUID();
  const relative = path.posix.join("blog", `${id}.webp`);
  const root = path.resolve(/* turbopackIgnore: true */ process.cwd(), env.MEDIA_ROOT);
  const destination = path.resolve(root, "blog", `${id}.webp`);

  // Both parts are generated server-side. This assertion is a belt-and-braces
  // check that no user-controlled path can escape the media root.
  if (!destination.startsWith(`${root}${path.sep}`)) {
    throw new ValidationError("The upload path is invalid.");
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, processed.data, { mode: 0o644 });

  try {
    await prisma.mediaAsset.create({
      data: {
        fileName: relative,
        originalName: path.basename(file.name).slice(0, 200),
        mimeType: "image/webp",
        sizeBytes: processed.data.byteLength,
        width: processed.info.width,
        height: processed.info.height,
        altText: altText.trim().slice(0, 180) || null,
        uploadedById: adminId,
      },
    });
  } catch {
    // Do not leave an orphaned executable file if metadata persistence fails.
    const { unlink } = await import("node:fs/promises");
    await unlink(destination).catch(() => undefined);
    throw new ValidationError("The image could not be saved. Please try again.");
  }

  return {
    url: `/uploads/${relative}`,
    fileName: relative,
    width: processed.info.width,
    height: processed.info.height,
  };
}
