import { z } from "zod";

export const SecretRegisterRequestSchema = z.object({
  message: z.string().min(1).max(5_000_000),
  controlmessage: z.string().min(1).max(256),
  burnsAfterXOpens: z.number().int().min(1).max(100).optional().default(1),
  ttl: z.number().int().min(60).max(86400).optional(), // 1 minute to 1 day
  file: z
    .object({
      name: z.string().min(1).max(255),
      type: z.string().min(1).max(100),
      data: z.string().min(1).max(25_000_000), // encrypted base64 payload
    })
    .optional(),
});
