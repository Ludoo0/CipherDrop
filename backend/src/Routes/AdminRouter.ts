// Import Utils
import express from "express";
// Import Handlers
import {
  allUsersHandler,
  deleteUserHandler,
} from "@/Handlers/AdminUserHandler";

// Import Middlewares
import { adminMiddleware } from "@/Middleware/authMiddleware";

// Express Router
const router = express.Router();

router.get("/users", adminMiddleware, allUsersHandler);
router.delete("/user/:username", adminMiddleware, deleteUserHandler);

export default router;
