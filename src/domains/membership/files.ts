import "server-only";

import { ValidationError } from "@/lib/errors";

/**
 * Applicant document validation on the PUBLIC WEBSITE side of the channel.
 *
 * The same bytes are validated again by the FMS (the authority), but checking
 * them here means an obviously wrong file is rejected before it is forwarded over
 * the network, and the applicant gets an immediate, specific message.
 *
 * The rule is the same one the FMS applies: **the content signature decides the
 * type, never the file extension or the browser-declared MIME type.**
 */

const SIGNATURES = {
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  webpRiff: Buffer.from("RIFF", "ascii"),
  webpTag: Buffer.from("WEBP", "ascii"),
  pdf: Buffer.from("%PDF-", "ascii"),
} as const;

export type ApplicantDocumentMime = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

const EXTENSION_BY_MIME: Record<ApplicantDocumentMime, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

function startsWith(data: Buffer, signature: Buffer): boolean {
  return data.length >= signature.length && data.subarray(0, signature.length).equals(signature);
}

/** The authoritative type of the bytes, or null when they are not accepted. */
export function sniffDocumentMime(data: Buffer): ApplicantDocumentMime | null {
  if (startsWith(data, SIGNATURES.pdf)) return "application/pdf";
  if (startsWith(data, SIGNATURES.png)) return "image/png";
  if (startsWith(data, SIGNATURES.jpeg)) return "image/jpeg";
  if (
    startsWith(data, SIGNATURES.webpRiff) &&
    data.length >= 12 &&
    data.subarray(8, 12).equals(SIGNATURES.webpTag)
  ) {
    return "image/webp";
  }
  return null;
}

/** Images only, for the two mandatory KYC slots. */
const IMAGE_TYPES: readonly ApplicantDocumentMime[] = ["image/jpeg", "image/png", "image/webp"];

/** Images or a PDF, for an optional supporting document. */
const SUPPORTING_TYPES: readonly ApplicantDocumentMime[] = [...IMAGE_TYPES, "application/pdf"];

export interface ValidatedApplicantFile {
  data: Buffer;
  mimeType: ApplicantDocumentMime;
  fileName: string;
}

/** Strip anything that is not safe in a stored file name (never a path). */
function safeFileName(raw: string, mimeType: ApplicantDocumentMime): string {
  const cleaned = raw
    .replace(/[\\/]/g, "-")
    // Collapse dot runs and strip leading dots so the stored label can never
    // look like a traversal segment (it is never used as a path, but a name is
    // also shown to staff).
    .replace(/\.{2,}/g, ".")
    .replace(/^[.\s]+/, "")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/["']/g, "")
    .trim()
    .slice(0, 180);
  const base = cleaned.length > 0 ? cleaned : "document";
  const hasExtension = /\.[A-Za-z0-9]{2,5}$/.test(base);
  return hasExtension ? base : `${base}${EXTENSION_BY_MIME[mimeType]}`;
}

/**
 * Validate one uploaded file.
 *
 * `kind` selects the accepted set: the National ID copy and the passport
 * photograph are images; a supporting document may also be a PDF.
 */
export function validateApplicantFile(input: {
  file: { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };
  kind: "NATIONAL_ID" | "PASSPORT_PHOTO" | "SUPPORTING_DOCUMENT";
  maxBytes: number;
  label: string;
}): Promise<ValidatedApplicantFile> {
  return (async () => {
    const declared = (input.file.type || "").toLowerCase();
    if (input.file.size === 0) {
      throw new ValidationError(`${input.label} is empty. Please choose the file again.`);
    }
    if (input.file.size > input.maxBytes) {
      throw new ValidationError(
        `${input.label} is larger than the ${Math.floor(input.maxBytes / (1024 * 1024))} MB limit.`,
      );
    }

    const data = Buffer.from(await input.file.arrayBuffer());
    if (data.byteLength === 0) {
      throw new ValidationError(`${input.label} is empty. Please choose the file again.`);
    }
    if (data.byteLength > input.maxBytes) {
      throw new ValidationError(
        `${input.label} is larger than the ${Math.floor(input.maxBytes / (1024 * 1024))} MB limit.`,
      );
    }

    const mimeType = sniffDocumentMime(data);
    if (!mimeType) {
      throw new ValidationError(
        `${input.label} must be a JPEG, PNG or WebP image${input.kind === "SUPPORTING_DOCUMENT" ? " or a PDF" : ""}.`,
      );
    }
    const allowed = input.kind === "SUPPORTING_DOCUMENT" ? SUPPORTING_TYPES : IMAGE_TYPES;
    if (!allowed.includes(mimeType)) {
      throw new ValidationError(`${input.label} must be an image (JPEG, PNG or WebP).`);
    }
    // A declared type that contradicts the bytes is a spoofing attempt (or a
    // broken client) and is refused rather than silently re-labelled.
    if (
      declared.length > 0 &&
      declared !== "application/octet-stream" &&
      declared !== mimeType
    ) {
      throw new ValidationError(
        `${input.label} does not look like the file type it claims to be. Please choose it again.`,
      );
    }

    return { data, mimeType, fileName: safeFileName(input.file.name, mimeType) };
  })();
}
