import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Global ignores first
  globalIgnores([
    "node_modules/**",
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    ".superpowers/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    "docs/**",
    "supabase/**",
    "patches/**",
    ".agents/**",
  ]),
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
