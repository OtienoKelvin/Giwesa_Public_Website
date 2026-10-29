import { z } from "zod";

import {
  emailSchema,
  honeypotSchema,
  personNameSchema,
  phoneSchema,
  startedAtSchema,
} from "@/lib/validation";
import { INQUIRY_SUBJECTS } from "@/config/site";

const subjects = INQUIRY_SUBJECTS.map((item) => item.value) as [string, ...string[]];

export const inquirySchema = z.object({
  name: personNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  subject: z.enum(subjects, {
    errorMap: () => ({ message: "Choose a subject." }),
  }),
  message: z
    .string()
    .trim()
    .min(10, "Please share a little more detail.")
    .max(2500, "Message must be 2,500 characters or fewer."),
  privacy: z.literal(true, {
    errorMap: () => ({ message: "Please accept the privacy notice." }),
  }),
  company: honeypotSchema,
  startedAt: startedAtSchema,
});

export type InquiryInput = z.infer<typeof inquirySchema>;
