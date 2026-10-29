import {z} from "zod";

export const UserRegisterRequestSchema = z.object({
    username: z.string().trim().min(1).max(50),
    email: z.email().max(100),
    password: z.string().min(8).max(255).refine(
        (password) => Buffer.byteLength(password, "utf8") <= 72,
        "Password must not exceed 72 UTF-8 bytes",
    ),
});
