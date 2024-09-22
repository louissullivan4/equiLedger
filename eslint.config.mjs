import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      ecmaVersion: 2021,
      globals: {
        ...globals.node,
        token: "readonly",
      },
    },
    plugins: {
      js: pluginJs,
    },
    rules: {
      "no-console": "off",
      "consistent-return": "off",
      "no-underscore-dangle": "off",
    },
  },
  pluginJs.configs.recommended,
];