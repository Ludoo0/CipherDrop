// Import Utils
import express from 'express';
import redisClient from "../Utils/Redis.js"
import { randomUUID } from 'crypto';
import {Logger} from "../Utils/Logger.js";

// Import Handlers
import {SecretRegisterHandler} from "../Handlers/SecretRegisterHandler.js";
import {SecretExistanceHandler} from "../Handlers/SecretExistanceHandler.js";
import {SecretGetMessageHandler} from "../Handlers/SecretGetMessageHandler.js";

// Import Middlewares
import {validateData} from "../Middleware/validationMiddleware.js";

// Import Schemas
import {SecretRegisterRequestSchema} from "../Schemas/SecretRegisterRequestSchema.js";
import {SecretGetMessageRequestSchema} from "../Schemas/SecretGetMessageRequestSchema.js";

// Express Router
const router = express.Router();

router.post('/register', validateData(SecretRegisterRequestSchema), SecretRegisterHandler);
router.get("/exists/:id", validateData(SecretGetMessageRequestSchema), SecretExistanceHandler);
router.get('/:id', SecretGetMessageHandler);



export default router;