import { z, ZodError } from 'zod';
import {Logger} from "../Utils/Logger.js";

export function validateData(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body)
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                if (Array.isArray(error.errors)) {
                    const errorDetails = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                    Logger.log(Logger.logLevels.DEBUG, Logger.contexts.MIDDLEWARE, `Validation error: ${errorDetails}`);
                    return res.status(422).json({ error: 'Invalid request data', details: error.errors});
                } else {
                    Logger.log(Logger.logLevels.ERROR, Logger.contexts.MIDDLEWARE, `Unexpected Zod error structure: ${error}`);
                    return res.status(500).json({ error: 'Internal server error' });
                }

            } else {
                Logger.log(Logger.logLevels.ERROR, Logger.contexts.MIDDLEWARE, `Unexpected error during validation: ${error}`);
                return res.status(500).json({ error: 'Internal server error' });
            }

        }
    }
}