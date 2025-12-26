// Import Utils
import express from 'express';

// Import Handlers
import {userRegisterHandler} from "../Handlers/UserRegisterHandler.js";
import {userLoginHandler, userLogoutHandler} from "../Handlers/UserLoginAndLogoutHandler.js";
import {userDeletionHandler} from "../Handlers/UserDeletionHandler.js";
import {userSecretHandler} from "../Handlers/UserSecretHandler.js";

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
router.get("/loginstatus", authMiddleware, (req, res) => {
    res.status(200).json({ loggedIn: true, username: req.session.username, isAdmin: req.session.admin || false });
});
router.get("/secrets/" , authMiddleware, userSecretHandler);
router.delete("/logout", authMiddleware, userLogoutHandler);
router.delete("/delete", authMiddleware, userDeletionHandler);

export default router;