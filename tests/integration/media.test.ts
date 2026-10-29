import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { hashPassword } from "@/domains/auth/password";
import { saveBlogCover } from "@/domains/media/service";
import { env } from "@/config/env";
import { prisma, resetDatabase } from "../helpers/db";

const mediaRoot = path.resolve(process.cwd(), env.MEDIA_ROOT);

async function createAdmin() {
  return prisma.adminUser.create({
    data: {
      name: "Media Tester",
      email: "media@test.local",
      passwordHash: await hashPassword("CorrectPassword123!"),
      role: "ADMIN",
    },
  });
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await rm(mediaRoot, { recursive: true, force: true });
  await prisma.$disconnect();
});

describe("cover image processing", () => {
  it("re-encodes an uploaded image to WebP and records the asset", async () => {
    const admin = await createAdmin();
    const input = await sharp({
      create: { width: 900, height: 600, channels: 3, background: "#013e77" },
    })
      .png()
      .toBuffer();
    const file = new File([new Uint8Array(input)], "test-cover.png", { type: "image/png" });
    const saved = await saveBlogCover(file, "A navy test cover", admin.id);

    expect(saved.url).toMatch(/^\/uploads\/blog\/[a-f0-9-]+\.webp$/);
    const onDisk = path.resolve(mediaRoot, saved.fileName);
    expect(onDisk.startsWith(mediaRoot)).toBe(true);
    await expect(readFile(onDisk)).resolves.toBeInstanceOf(Buffer);
    const metadata = await sharp(await readFile(onDisk)).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(900);
    expect(metadata.height).toBe(600);

    const asset = await prisma.mediaAsset.findFirst({ where: { fileName: saved.fileName } });
    expect(asset?.mimeType).toBe("image/webp");
    expect(asset?.altText).toBe("A navy test cover");
    expect(asset?.uploadedById).toBe(admin.id);
  });

  it("rejects a file that only claims to be an image", async () => {
    const admin = await createAdmin();
    await mkdir(mediaRoot, { recursive: true });
    const file = new File(
      [new TextEncoder().encode("<svg><script>alert(1)</script></svg>")],
      "bad.png",
      {
        type: "image/png",
      },
    );
    await expect(saveBlogCover(file, "Bad image", admin.id)).rejects.toThrow();
    expect(await prisma.mediaAsset.count()).toBe(0);
  });
});
