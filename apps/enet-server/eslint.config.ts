import { eslintConfig } from "@growserver/config/eslint";

export default [
  ...eslintConfig,
  {
    languageOptions: {
      parserOptions: {
        project:         true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
];
