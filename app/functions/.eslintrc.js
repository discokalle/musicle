module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    // "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "lib/**", // Ignore built files.
    "generated/**/*", // Ignore generated files.
  ],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    "no-unused-expressions": "off", // Correct: Turn off the base ESLint rule
    "@typescript-eslint/no-unused-expressions": [
      "error",
      {
        // Correct: Enable and configure the TypeScript version
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      },
    ],
    // "@typescript-eslint/no-explicit-any": 0,
    quotes: ["error", "double"],
    "import/no-unresolved": 0,
    indent: ["error", 2],
  },
};
