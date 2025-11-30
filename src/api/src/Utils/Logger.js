import { styleText } from "node:util";

export class Logger {
    static logLevels = {
        INFO: styleText("blue", "INFO"),
        WARN: styleText("yellow", "WARN"),
        ERROR: styleText("red", "ERROR"),
        DEBUG: styleText("green", "DEBUG")
    };
    static contexts = {
        GENERAL: styleText("green", "GENERAL"),
        REDIS: styleText("red", "REDIS"),
        ROUTES: styleText("cyan", "ROUTES"),
        AUTH: styleText("blue", "AUTH"),
        DB: styleText("green", "DB"),
        MIDDLEWARE: styleText("magenta", "MIDDLEWARE")
    };
    static log(level, context, message) {
        const timestamp = new Date().toISOString();
        console.log(`[${styleText("grey", timestamp)}] [${level}] [${context}] ${message}`);
    }
}