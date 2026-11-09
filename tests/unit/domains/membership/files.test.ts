import { describe, expect, it } from "vitest";

import { sniffDocumentMime, validateApplicantFile } from "@/domains/membership/files";

/**
 * Applicant document validation on the website side.
 *
 * The content signature decides the type; a file extension or a browser-declared
 * MIME type is only a hint. These tests pin that, the size ceiling, and the
 * refusal of a declared type that contradicts the bytes.
 */

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 2),
]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "ascii"),
  Buffer.from([0x20, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP", "ascii"),
  Buffer.alloc(64, 3),
]);
const PDF = Buffer.concat([Buffer.from("%PDF-1.7\n", "ascii"), Buffer.alloc(64, 4)]);

function file(data: Buffer, name: string, type: string) {
  return {
    name,
    type,
    size: data.byteLength,
    arrayBuffer: async () => {
      // A real ArrayBuffer copy of the exact bytes (Buffer#buffer can be a
      // SharedArrayBuffer in the type system and may include unrelated bytes).
      const copy = new Uint8Array(data.byteLength);
      copy.set(data);
      return copy.buffer;
    },
  };
}

describe("document type sniffing", () => {
  it("identifies the accepted types from their leading bytes", () => {
    expect(sniffDocumentMime(JPEG)).toBe("image/jpeg");
    expect(sniffDocumentMime(PNG)).toBe("image/png");
    expect(sniffDocumentMime(WEBP)).toBe("image/webp");
    expect(sniffDocumentMime(PDF)).toBe("application/pdf");
  });

  it("refuses content that is not an accepted type", () => {
    expect(sniffDocumentMime(Buffer.from("hello world"))).toBeNull();
    expect(sniffDocumentMime(Buffer.alloc(0))).toBeNull();
    // A RIFF container that is not WebP (e.g. WAV) is not accepted.
    expect(
      sniffDocumentMime(
        Buffer.concat([
          Buffer.from("RIFF", "ascii"),
          Buffer.from([0, 0, 0, 0]),
          Buffer.from("WAVE", "ascii"),
        ]),
      ),
    ).toBeNull();
  });
});

describe("applicant file validation", () => {
  it("accepts an image for the National ID slot", async () => {
    const validated = await validateApplicantFile({
      file: file(JPEG, "my-id.jpg", "image/jpeg"),
      kind: "NATIONAL_ID",
      maxBytes: 1024 * 1024,
      label: "Your National ID copy",
    });
    expect(validated.mimeType).toBe("image/jpeg");
    expect(validated.fileName).toBe("my-id.jpg");
    expect(validated.data.byteLength).toBe(JPEG.byteLength);
  });

  it("refuses a PDF for the National ID slot (an image is required)", async () => {
    await expect(
      validateApplicantFile({
        file: file(PDF, "id.pdf", "application/pdf"),
        kind: "NATIONAL_ID",
        maxBytes: 1024 * 1024,
        label: "Your National ID copy",
      }),
    ).rejects.toThrow(/must be an image/i);
  });

  it("allows a PDF as a supporting document", async () => {
    const validated = await validateApplicantFile({
      file: file(PDF, "permit.pdf", "application/pdf"),
      kind: "SUPPORTING_DOCUMENT",
      maxBytes: 1024 * 1024,
      label: "The supporting document",
    });
    expect(validated.mimeType).toBe("application/pdf");
  });

  it("refuses a file whose declared type contradicts its bytes", async () => {
    await expect(
      validateApplicantFile({
        file: file(JPEG, "id.png", "image/png"),
        kind: "PASSPORT_PHOTO",
        maxBytes: 1024 * 1024,
        label: "Your photograph",
      }),
    ).rejects.toThrow(/does not look like/i);
  });

  it("accepts an opaque declared type", async () => {
    const validated = await validateApplicantFile({
      file: file(PNG, "photo", "application/octet-stream"),
      kind: "PASSPORT_PHOTO",
      maxBytes: 1024 * 1024,
      label: "Your photograph",
    });
    expect(validated.mimeType).toBe("image/png");
    // A missing extension is added from the sniffed type.
    expect(validated.fileName).toBe("photo.png");
  });

  it("refuses an empty file", async () => {
    await expect(
      validateApplicantFile({
        file: file(Buffer.alloc(0), "empty.jpg", "image/jpeg"),
        kind: "PASSPORT_PHOTO",
        maxBytes: 1024,
        label: "Your photograph",
      }),
    ).rejects.toThrow(/empty/i);
  });

  it("refuses a file over the size limit", async () => {
    await expect(
      validateApplicantFile({
        file: file(JPEG, "big.jpg", "image/jpeg"),
        kind: "PASSPORT_PHOTO",
        maxBytes: 10,
        label: "Your photograph",
      }),
    ).rejects.toThrow(/larger than/i);
  });

  it("refuses arbitrary bytes dressed up as an image", async () => {
    await expect(
      validateApplicantFile({
        file: file(Buffer.from("this is not an image"), "id.jpg", "image/jpeg"),
        kind: "NATIONAL_ID",
        maxBytes: 1024,
        label: "Your National ID copy",
      }),
    ).rejects.toThrow(/must be a JPEG, PNG or WebP/i);
  });

  it("sanitises a hostile file name instead of using it as a path", async () => {
    const validated = await validateApplicantFile({
      file: file(JPEG, "../../etc/passwd", "image/jpeg"),
      kind: "PASSPORT_PHOTO",
      maxBytes: 1024 * 1024,
      label: "Your photograph",
    });
    expect(validated.fileName).not.toContain("/");
    expect(validated.fileName).not.toContain("..");
  });
});
