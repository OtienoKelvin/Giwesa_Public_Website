import "server-only";

import nodemailer from "nodemailer";

import { env, emailNotificationsConfigured } from "@/config/env";
import type { Booking, Inquiry } from "@/generated/prisma/client";
import { logger } from "@/lib/logger";

function createTransport() {
  if (!emailNotificationsConfigured()) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_SECURE === "true",
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" },
  });
}

/**
 * Delivery is best-effort and always decoupled from persistence. A visitor's
 * inquiry or booking is already committed before this runs, so an SMTP outage
 * can never discard a lead.
 */
export async function sendNewInquiryNotification(inquiry: Inquiry): Promise<boolean> {
  const transport = createTransport();
  const to = env.NOTIFICATION_EMAIL;
  if (!transport || !to) {
    logger.info("Inquiry email skipped; SMTP or NOTIFICATION_EMAIL is not configured");
    return false;
  }

  const body = [
    "A new inquiry was submitted through the GIWESA website.",
    "",
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Phone: ${inquiry.phone}`,
    `Subject: ${inquiry.subject}`,
    `Received: ${inquiry.createdAt.toISOString()}`,
    "",
    "Message:",
    inquiry.message,
    "",
    "Open the admin area to respond and update its status.",
  ].join("\n");

  try {
    await transport.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      to,
      replyTo: inquiry.email,
      subject: `New website inquiry: ${inquiry.subject}`,
      text: body,
    });
    return true;
  } catch {
    logger.error("Inquiry notification email failed");
    return false;
  }
}

export async function sendNewBookingNotification(booking: Booking): Promise<boolean> {
  const transport = createTransport();
  const to = env.NOTIFICATION_EMAIL;
  if (!transport || !to) {
    logger.info("Booking email skipped; SMTP or NOTIFICATION_EMAIL is not configured");
    return false;
  }

  const body = [
    "A new consultation request was submitted through the GIWESA website.",
    "",
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Area of interest: ${booking.areaOfInterest}`,
    `Preferred date: ${booking.preferredDate.toISOString().slice(0, 10)}`,
    `Preferred time: ${booking.preferredTime}`,
    `Received: ${booking.createdAt.toISOString()}`,
    "",
    "Message:",
    booking.message || "(No additional message)",
    "",
    "This is a request, not a confirmed appointment. Contact the visitor to confirm.",
  ].join("\n");

  try {
    await transport.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      to,
      replyTo: booking.email,
      subject: `New consultation request: ${booking.areaOfInterest}`,
      text: body,
    });
    return true;
  } catch {
    logger.error("Booking notification email failed");
    return false;
  }
}

export function emailDeliveryConfigured(): boolean {
  return emailNotificationsConfigured() && Boolean(env.NOTIFICATION_EMAIL);
}
