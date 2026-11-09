import "server-only";

import {
  createMembershipApplication,
  declareMembershipManualPayment,
  fetchMembershipConfig,
  fetchMembershipStatus,
  initiateMembershipStk,
  membershipChannelConfigured,
  MembershipConflictError,
  MembershipRejectedError,
  MembershipUnavailableError,
  submitMembershipApplication,
  uploadMembershipDocument,
  type CreatedMembershipApplication,
  type MembershipApplicationSnapshot,
  type MembershipChannelConfig,
} from "@/domains/membership/fms-client";
import { logger } from "@/lib/logger";

import type { MembershipApplicationValues } from "./schema";

/**
 * The membership registration workflow, as the public website implements it.
 *
 * ## What this module does NOT do
 *
 * It does not store an application, does not decide membership rules, does not
 * generate a reference and does not record a payment. All of that belongs to the
 * FMS, which owns the membership domain and the financial ledger. This module
 * validates what the visitor typed, forwards it over the signed channel, uploads
 * the documents, and submits the application into the EXISTING approval workflow.
 *
 * ## Failure behaviour
 *
 * An application is created FIRST and submitted LAST. If an upload or the submit
 * call fails, the draft already exists in the FMS; the caller is told the
 * application reference and that retrying is safe (the submission key makes the
 * retry idempotent). Nothing is ever silently discarded.
 */

/**
 * Short-lived configuration cache.
 *
 * The fee and the available payment options come from the FMS on every page
 * load; caching them for a minute keeps the page fast without ever showing a
 * stale answer for long. A failed refresh keeps serving the last good value —
 * configuration does not disappear because one poll failed — while a cold failure
 * surfaces as "not available".
 */
const CONFIG_TTL_MS = 60_000;

let cachedConfig: { value: MembershipChannelConfig; fetchedAt: number } | null = null;

export async function getMembershipConfig(): Promise<MembershipChannelConfig | null> {
  if (!membershipChannelConfigured()) return null;
  const now = Date.now();
  if (cachedConfig && now - cachedConfig.fetchedAt < CONFIG_TTL_MS) {
    return cachedConfig.value;
  }
  try {
    const value = await fetchMembershipConfig();
    cachedConfig = { value, fetchedAt: now };
    return value;
  } catch (error) {
    logger.warn("Membership configuration could not be refreshed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return cachedConfig?.value ?? null;
  }
}

/** Test hook: forget the cached configuration. */
export function resetMembershipConfigCache(): void {
  cachedConfig = null;
}

/** The FMS payload for a validated form submission. */
export function toFmsPayload(values: MembershipApplicationValues): Record<string, unknown> {
  const text = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };
  const number = (value: string, parse: (input: string) => number) => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? parse(trimmed) : null;
  };

  return {
    firstName: values.firstName.trim(),
    middleName: text(values.middleName),
    surname: values.surname.trim(),
    nationalId: values.nationalId.trim(),
    dateOfBirth: text(values.dateOfBirth),
    gender: values.gender === "" ? null : values.gender,
    maritalStatus: values.maritalStatus === "" ? null : values.maritalStatus,
    occupation: text(values.occupation),
    employerName: text(values.employerName),
    primaryPhone: values.primaryPhone,
    alternativePhone: text(values.alternativePhone),
    email: values.email,
    postalAddress: text(values.postalAddress),
    county: text(values.county),
    subCounty: text(values.subCounty),
    ward: text(values.ward),
    villageEstate: text(values.villageEstate),
    nextOfKinName: text(values.nextOfKinName),
    nextOfKinRelationship: text(values.nextOfKinRelationship),
    nextOfKinPhone: text(values.nextOfKinPhone),
    nextOfKinPhysicalAddress: text(values.nextOfKinPhysicalAddress),
    hasBusiness: values.hasBusiness,
    businessName: values.hasBusiness ? text(values.businessName) : null,
    businessType: values.hasBusiness ? text(values.businessType) : null,
    businessLocation: values.hasBusiness ? text(values.businessLocation) : null,
    yearsInOperation: values.hasBusiness
      ? number(values.yearsInOperation, (input) => Number.parseInt(input, 10))
      : null,
    savingsFrequency: values.savingsFrequency === "" ? null : values.savingsFrequency,
    expectedSavingsAmount: number(values.expectedSavingsAmount, (input) =>
      Number.parseFloat(input),
    ),
    paymentOption: values.paymentOption,
    ...(values.paymentOption === "STK_PUSH" ? { mpesaPhone: values.mpesaPhone } : {}),
    consent: true,
  };
}

export interface MembershipFiles {
  nationalId: { fileName: string; mimeType: string; data: Buffer } | null;
  photograph: { fileName: string; mimeType: string; data: Buffer } | null;
  supporting: { fileName: string; mimeType: string; data: Buffer } | null;
}

export interface SubmittedMembership {
  application: CreatedMembershipApplication;
  /** The submitted snapshot (after the submit transition). */
  snapshot: MembershipApplicationSnapshot;
}

/**
 * Create the application, upload the mandatory documents and submit it.
 *
 * The order is deliberate: the application exists before any file is sent, so a
 * failed upload leaves a recoverable DRAFT rather than an orphaned file, and the
 * submission is the last step, so it can never happen with missing documents
 * (the FMS re-checks them anyway).
 */
export async function submitMembership(options: {
  values: MembershipApplicationValues;
  files: MembershipFiles;
  idempotencyKey: string;
}): Promise<SubmittedMembership> {
  const application = await createMembershipApplication({
    fields: toFmsPayload(options.values),
    idempotencyKey: options.idempotencyKey,
  });

  try {
    // A REPLAY of a submission that already reached the FMS comes back with its
    // current status. If it was already submitted, the documents are already
    // attached and uploading them again would be refused (documents may only be
    // added to a draft) — so the replay goes straight to the idempotent submit.
    if (application.status === "DRAFT") {
      const mandatory = [
        { type: "NATIONAL_ID" as const, file: options.files.nationalId },
        { type: "PASSPORT_PHOTO" as const, file: options.files.photograph },
      ];
      for (const item of mandatory) {
        if (!item.file) continue;
        await uploadMembershipDocument({
          applicationId: application.applicationId,
          token: application.token,
          documentType: item.type,
          fileName: item.file.fileName,
          mimeType: item.file.mimeType,
          data: item.file.data,
        });
      }
      if (options.files.supporting) {
        await uploadMembershipDocument({
          applicationId: application.applicationId,
          token: application.token,
          documentType: "SUPPORTING_DOCUMENT",
          fileName: options.files.supporting.fileName,
          mimeType: options.files.supporting.mimeType,
          data: options.files.supporting.data,
        });
      }
    }

    const snapshot = await submitMembershipApplication({
      applicationId: application.applicationId,
      token: application.token,
    });

    return { application, snapshot };
  } catch (error) {
    // The draft EXISTS at this point. A rejected file/field is reported as-is so
    // the visitor can fix it; anything else tells them the reference and that
    // pressing Submit again is safe (the submission key makes the retry idempotent
    // and the FMS reuses the same application).
    if (
      error instanceof MembershipRejectedError ||
      error instanceof MembershipConflictError
    ) {
      throw error;
    }
    throw new MembershipUnavailableError(
      `Your application ${application.applicationNumber} was saved, but it could not be completed just now. ` +
        "Please press Submit application again — nothing has been lost.",
    );
  }
}

export async function getMembershipStatus(options: {
  applicationId: string;
  token: string;
}): Promise<MembershipApplicationSnapshot> {
  return fetchMembershipStatus(options);
}

export async function startMembershipPayment(options: {
  applicationId: string;
  token: string;
  phone: string;
}) {
  return initiateMembershipStk(options);
}

export async function declareManualPayment(options: {
  applicationId: string;
  token: string;
  mpesaCode: string;
}): Promise<MembershipApplicationSnapshot> {
  return declareMembershipManualPayment(options);
}
