// Import Utils
import express from 'express';

// Import Handlers
import {allUsersHandler} from "../Handlers/AdminUserHandler.js";
import {deleteUserHandler} from "../Handlers/AdminUserHandler.js";

// Import Middlewares
import {authMiddleware} from "../Middleware/authMiddleware.js";
import {adminMiddleware} from "../Middleware/authMiddleware.js";

// Express Router
const router = express.Router();

router.get('/users', authMiddleware, adminMiddleware, allUsersHandler);
router.delete('/user/:username', authMiddleware, adminMiddleware, deleteUserHandler);

export default router;