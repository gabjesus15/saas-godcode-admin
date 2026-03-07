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
  ]),
  {
    rules: {
      // Allow inline styles for CSS custom properties (CSS variables)
      "@next/next/no-css-tags": "off",
      // Disable inline styles warning - required for dynamic CSS custom properties
      "react/no-unknown-property": ["error", { "ignore": ["style"] }],
    },
  },
  {
    files: ["components/tenant/admin/kit/auth/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/products/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/cart/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/admin/components/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/admin/hooks/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/admin/pages/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/admin/services/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/admin/utils/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/components/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/context/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/lib/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/orders/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["components/tenant/admin/kit/shared/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
