import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import reactPlugin from "eslint-plugin-react";

/*
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', "vendor/"],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  settings: { react: { version: '19.1.1' } },
  plugins: ['react-refresh'],
  rules: {
    "react-hooks/exhaustive-deps": 0,
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error",
    "no-undef": 0,
    "no-case-declarations": 0,
    "react/prop-types": 0,
    "semi": ["error", "always", { "omitLastInOneLineClassBody": true }],
    "react-refresh/only-export-components": [
      'warn',
      { allowConstantExport: true },
    ],
    "no-console": ["error", { "allow": ["error"] }],
    "quotes": [
      "error",
      "double"
    ]
  },
}

 */


export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactPlugin.configs.flat.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      "react-hooks/exhaustive-deps": 0,
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "no-undef": 0,
      "no-case-declarations": 0,
      "react/prop-types": 0,
      "semi": ["error", "always", { "omitLastInOneLineClassBody": true }],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "no-console": ["error", { "allow": ["error", "info", "time", "timeEnd"] }],
      "quotes": [
        "error",
        "double"
      ]
    },
  },
]);
