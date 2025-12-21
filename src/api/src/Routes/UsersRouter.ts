// Import Utils
import express from 'express';

// Import Handlers
import {UserRegisterHandler} from "../Handlers/UserRegisterHandler.js";

// Import Middlewares
import {validateData} from "../Middleware/validationMiddleware.js";

// Import Schemas
import {UserRegisterRequestSchema} from "../Schemas/UserRegisterRequestSchema.js";


// Express Router
const router = express.Router();

router.post("/register", validateData(UserRegisterRequestSchema), UserRegisterHandler);

export default router;