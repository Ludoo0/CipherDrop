import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config({quiet: true});
import {Logger} from "./Utils/Logger.js";

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(express.json());

// Routes
app.use("/secrets", (await import('./Routes/SecretsRouter.js')).default);

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});



// Start server
app.listen(PORT, () => {
    Logger.log(Logger.logLevels.INFO, Logger.contexts.GENERAL, `Server started on port ${PORT}`);
});