import { z } from "zod";

import { emailSchema } from "@/lib/validation";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Enter your password.").max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
