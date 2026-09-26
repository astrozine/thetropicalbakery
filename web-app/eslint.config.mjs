import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off helper scripts and scratch files at the root of web-app, not part of the site.
    "*.cjs",
    "replace_*.js",
    "previous_*.tsx",
    // The edge function runs on Deno, with its own types.
    "supabase/functions/**",
    "tools/**",
  ]),
  {
    // React's newer "compiler" rules flag patterns this codebase uses on purpose and that work
    // (reading localStorage in an effect, `any` on Supabase rows). They are worth seeing, but as
    // warnings: as errors they buried the real ones and made `npm run lint` useless as a gate.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
