// eslint.config.js
import eslint from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([

    // JavaScript recommended rules
    eslint.configs.recommended,

    // TypeScript files
    {
        files: ["**/*.ts"],
        ignores: ["node_modules/**", "dist/**"],

        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                project: "./tsconfig.json",
            },
            globals: {
                ...globals.node,
            }
        },

        plugins: {
            "@typescript-eslint": tsPlugin,
        },

        rules: {
            ...tsPlugin.configs["recommended"].rules,

            // Your own custom rules:
            semi: "error",
            "prefer-const": "error",

            // Disable JS version of these rules:
            "no-unused-vars": "off",
            "no-empty-function": "off",

            // TS versions:
            "@typescript-eslint/no-unused-vars": ["warn"],
            "@typescript-eslint/no-empty-function": ["warn"]
        }
    }
]);
