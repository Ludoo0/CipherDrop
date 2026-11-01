import { styleText } from "node:util";

export const Logger = {
  logLevels: {
    INFO: styleText("blue", "INFO"),
    WARN: styleText("yellow", "WARN"),
    ERROR: styleText("red", "ERROR"),
    DEBUG: styleText("green", "DEBUG"),
  },
  contexts: {
    GENERAL: styleText("green", "GENERAL"),
    REDIS: styleText("red", "REDIS"),
    ROUTES: styleText("cyan", "ROUTES"),
    AUTH: styleText("blue", "AUTH"),
    DB: styleText("green", "DB"),
    MIDDLEWARE: styleText("magenta", "MIDDLEWARE"),
  },
  log: (level: string, context: string, message: string) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${styleText("grey", timestamp)}] [${level}] [${context}] ${message}`,
    );
  },
};
