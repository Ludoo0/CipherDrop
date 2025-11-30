// eslint.config.js
import { defineConfig } from "eslint/config";

export default defineConfig([
    // matches all files ending with .js
    {
        files: ["**/*.js"],
        rules: {
            semi: "error",
            "prefer-const": "error",
            "no-console": ["error", { "allow": ["log", "warn", "error"] }]
        },
    },

    // matches all files ending with .js except those in __tests
    {
        files: ["**/*.js"],
        ignores: ["__tests/**"],
        rules: {
            "no-console": "error",
        },
    },
]);
