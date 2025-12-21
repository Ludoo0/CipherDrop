// Import Utils
import express from 'express';

// Import Handlers
import {userRegisterHandler} from "../Handlers/UserRegisterHandler.js";
import {userLoginHandler, userLogoutHandler} from "../Handlers/UserLoginAndLogoutHandler.js";

// Import Middlewares
import {validateData} from "../Middleware/validationMiddleware.js";
import {authMiddleware} from "../Middleware/authMiddleware.js";

// Import Schemas
import {UserRegisterRequestSchema} from "../Schemas/UserRegisterRequestSchema.js";
import {UserLoginRequestSchema} from "../Schemas/UserLoginRequestSchema.js";

// Express Router
const router = express.Router();

router.post("/register", validateData(UserRegisterRequestSchema), userRegisterHandler);
router.post("/login", validateData(UserLoginRequestSchema), userLoginHandler);
router.post("/logout", authMiddleware, userLogoutHandler);

export default router;