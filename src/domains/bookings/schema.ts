import { z } from "zod";

import { INTEREST_OPTIONS, PREFERRED_TIMES } from "@/config/site";
import {
  emailSchema,
  honeypotSchema,
  personNameSchema,
  phoneSchema,
  preferredDateSchema,
  startedAtSchema,
} from "@/lib/validation";

const areas = INTEREST_OPTIONS.map((item) => item.value) as [string, ...string[]];
const times = PREFERRED_TIMES.map((item) => item.value) as [string, ...string[]];

export const bookingSchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  areaOfInterest: z.enum(areas, {
    errorMap: () => ({ message: "Choose an area of interest." }),
  }),
  preferredDate: preferredDateSchema,
  preferredTime: z.enum(times, {
    errorMap: () => ({ message: "Choose a preferred time." }),
  }),
  message: z
    .string()
    .trim()
    .max(1500, "Message must be 1,500 characters or fewer.")
    .optional()
    .or(z.literal("")),
  privacy: z.literal(true, {
    errorMap: () => ({ message: "Please accept the privacy notice." }),
  }),
  company: honeypotSchema,
  startedAt: startedAtSchema,
});

export type BookingInput = z.infer<typeof bookingSchema>;
