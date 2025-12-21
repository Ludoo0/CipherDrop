import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";
import {Logger} from "./Utils/Logger.js";

dotenv.config({quiet: true});
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.set('trust proxy', 1);
const limiter = rateLimit({
    windowMs: 5*60*1000,
    max: 10,
});
app.use(limiter);
app.use(helmet());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/secrets", (await import('./Routes/SecretsRouter.js')).default);
app.use("/users", (await import('./Routes/UsersRouter.js')).default);

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});



// Start server
app.listen(PORT, () => {
    Logger.log(Logger.logLevels.INFO, Logger.contexts.GENERAL, `Server started on port ${PORT}`);
});