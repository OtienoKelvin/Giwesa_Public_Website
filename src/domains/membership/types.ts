/**
 * The membership registration contract, shared by the browser and the server.
 *
 * This module deliberately has NO `server-only` import: the client form needs the
 * shapes to render the fee, the payment options and the confirmation. Nothing in
 * here is a credential — the channel key and secret live only in
 * `fms-client.ts`, which is server-only.
 */

export const PAYMENT_OPTION_VALUES = ["STK_PUSH", "MANUAL", "PAY_LATER"] as const;
export type PaymentOptionValue = (typeof PAYMENT_OPTION_VALUES)[number];

export type PaymentStateValue =
  "UNPAID" | "PAYMENT_PENDING" | "AWAITING_MANUAL_VERIFICATION" | "PAID" | "FAILED" | "REVERSED";

export interface MembershipChannelConfig {
  channelOpen: boolean;
  registrationFee: { amount: number; currency: string; display: string };
  paybill: string | null;
  payLaterEnabled: boolean;
  stkEnabled: boolean;
  manualEnabled: boolean;
  documents: {
    mandatory: string[];
    optional: string[];
    maxBytes: number;
    acceptedMimeTypes: string[];
  };
  contact: { phone: string; email: string; website: string; address: string };
}

export interface MembershipApplicationSnapshot {
  applicationId: string;
  applicationNumber: string;
  paymentReference: string;
  status: string;
  paymentOption: string | null;
  paymentState: string;
  submittedAt: string | null;
  createdAt: string;
  fee: { amount: number; currency: string; paid: number; outstanding: number; satisfied: boolean };
  documents: Array<{ type: string; uploaded: boolean; verificationStatus: string | null }>;
  stk: { id: string; status: string; amount: number; phone: string } | null;
  pdf: { available: boolean };
}

export interface CreatedMembershipApplication extends MembershipApplicationSnapshot {
  token: string;
  tokenExpiresAt: string;
  replayed: boolean;
}

export interface StkInitiation {
  stkRequestId: string;
  status: string;
  amount: number;
  phone: string;
  message: string;
}

/** Human labels, mirrored from the FMS vocabulary. */
export const PAYMENT_STATE_LABELS: Record<string, string> = {
  UNPAID: "Outstanding",
  PAYMENT_PENDING: "Payment pending",
  AWAITING_MANUAL_VERIFICATION: "Awaiting verification",
  PAID: "Paid",
  FAILED: "Payment not completed",
  REVERSED: "Payment reversed",
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Received — awaiting review",
  UNDER_REVIEW: "Under review",
  CORRECTIONS_REQUIRED: "Corrections required",
  RESUBMITTED: "Resubmitted — awaiting review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
};
