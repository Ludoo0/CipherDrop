// eslint.config.js
import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import globals from "globals";

export default defineConfig([
    eslint.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            globals: {
                ...globals.node,   // ← fügt process, console, require, module usw. hinzu
                ...globals.es2021,
            }
        },
        rules: {
            semi: "error",
            "prefer-const": "error",
            "no-unused-vars": "warn",
            "no-empty-function": "warn"
        },
    },
]);