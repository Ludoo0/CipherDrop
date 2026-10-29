import express from "express";
import { userDeletionHandler } from "@/Handlers/UserDeletionHandler";
import {
  userLoginHandler,
  userLogoutHandler,
} from "@/Handlers/UserLoginAndLogoutHandler";
import { userRegisterHandler } from "@/Handlers/UserRegisterHandler";
import {
  userSecretHandler,
  userSecretSummaryHandler,
} from "@/Handlers/UserSecretHandler";
import { authMiddleware } from "@/Middleware/authMiddleware";
import { validateData } from "@/Middleware/validationMiddleware";
import { UserLoginRequestSchema } from "@/Schemas/UserLoginRequestSchema";
import { UserRegisterRequestSchema } from "@/Schemas/UserRegisterRequestSchema";

// Express Router
const router = express.Router();

router.post(
  "/register",
  validateData(UserRegisterRequestSchema),
  userRegisterHandler,
);
router.post("/login", validateData(UserLoginRequestSchema), userLoginHandler);
router.get("/loginstatus", authMiddleware, (req, res) => {
  res.status(200).json({
    loggedIn: true,
    username: req.session.username,
    isAdmin: req.session.admin || false,
  });
});
router.get("/secrets/summary", authMiddleware, userSecretSummaryHandler);
router.get("/secrets/", authMiddleware, userSecretHandler);
router.delete("/logout", authMiddleware, userLogoutHandler);
router.delete("/delete", authMiddleware, userDeletionHandler);

export default router;
