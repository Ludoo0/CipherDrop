import { z } from 'zod';

export const SecretGetMessageRequestSchema = z.object({
    controlmessage: z.string().min(1).max(5000)
});