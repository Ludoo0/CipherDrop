import {z} from "zod";

export const UserLoginRequestSchema = z.object({
    username: z.string().min(1).max(5000),
    password: z.string().min(8).max(255),
});