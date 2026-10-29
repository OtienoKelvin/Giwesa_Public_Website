import { prisma } from "@/db/client";

const databaseName = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? "").pathname.replace(/^\//, "");
  } catch {
    return "";
  }
})();

if (!databaseName.endsWith("_test")) {
  throw new Error(
    "Integration tests refuse to run unless DATABASE_URL points at a database whose name ends in _test.",
  );
}

export async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.mediaAsset.deleteMany(),
    prisma.blogPost.deleteMany(),
    prisma.product.deleteMany(),
    prisma.inquiry.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.session.deleteMany(),
    prisma.adminUser.deleteMany(),
    prisma.siteSetting.deleteMany(),
  ]);
}

export { prisma };
