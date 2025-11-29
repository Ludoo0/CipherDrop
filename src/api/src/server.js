import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();
import {Logger} from "./Utils/Logger.js";


const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(express.json());
app.use((req, res, next) => {
    Logger.log(Logger.logLevels.INFO, Logger.contexts.ROUTES, `${req.method} ${req.originalUrl}`);
    next();
});

// Routes
app.use("/secrets", (await import('./Routes/SecretsRouter.js')).default);

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});



// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    Logger.log(Logger.logLevels.INFO, Logger.contexts.GENERAL, `Server started on port ${PORT}`);
});