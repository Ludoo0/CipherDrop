// Import Utils
import express from "express";
import { SecretExistanceHandler } from "@/Handlers/SecretExistanceHandler";
import { SecretGetMessageHandler } from "@/Handlers/SecretGetMessageHandler";
import { SecretRegisterHandler } from "@/Handlers/SecretRegisterHandler";
import { validateData } from "@/Middleware/validationMiddleware";
import { SecretRegisterRequestSchema } from "@/Schemas/SecretRegisterRequestSchema";

// Express Router
const router = express.Router();

router.post(
  "/register",
  validateData(SecretRegisterRequestSchema),
  SecretRegisterHandler,
);
router.get("/exists/:id", SecretExistanceHandler);
router.get("/:id", SecretGetMessageHandler);
router.post("/:id", SecretGetMessageHandler);

export default router;
