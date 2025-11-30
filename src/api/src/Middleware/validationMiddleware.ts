import { ZodError, type ZodTypeAny } from "zod";
import { Logger } from "../Utils/Logger.js";
import type { Request, Response, NextFunction } from "express";

export function validateData<T extends ZodTypeAny>(schema: T) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (result.success) {
            req.body = result.data;
            return next();
        }

        const error = result.error;

        if (error instanceof ZodError) {
            const issueDetails = error.issues
                .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                .join(", ");

            Logger.log(
                Logger.logLevels.DEBUG,
                Logger.contexts.MIDDLEWARE,
                `Validation error: ${issueDetails}`
            );

            return res.status(422).json({
                error: "Invalid request data",
                details: error.issues,
            });
        }

        Logger.log(
            Logger.logLevels.ERROR,
            Logger.contexts.MIDDLEWARE,
            `Unexpected validation error: ${error}`
        );

        return res.status(500).json({ error: "Internal server error" });
    };
}
