import {z} from "zod";

export const SecretRegisterRequestSchema = z.object({
    message: z.string().min(1).max(5000),
    controlmessage: z.string().min(1).max(5000),
    burnsAfterXOpens: z.number().int().min(1).max(100).optional().default(1),
    ttl: z.number().int().min(60).max(86400).optional().default(3600), // 1 minute to 1 day
    file: z.object({
        name: z.string().min(1).max(255),
        type: z.string().min(1).max(100),
        data: z.string().min(1) // base64 encoded string
    }).optional()
});