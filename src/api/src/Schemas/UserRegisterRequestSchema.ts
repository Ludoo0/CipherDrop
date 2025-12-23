import {z} from "zod";

export const UserRegisterRequestSchema = z.object({
    username: z.string().min(1).max(5000),
    email: z.email(),
    password: z.string().min(8).max(255),
});