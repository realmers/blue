import tseslint from "typescript-eslint";

export default tseslint.config(
  // 1. Global ignores
  {
    ignores: ["node_modules", ".next", "prisma/seed.ts"],
  },

  // 2. Recommended TypeScript configurations 
  tseslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  // 3. Custom Rules and overrides
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      
      // Enhanced naming convention rules
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        {
          selector: "variable",
          types: ["boolean"],
          format: ["camelCase", "PascalCase"],
          prefix: ["is", "has", "can", "should", "will", "did"],
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: ["class", "interface", "typeAlias"],
          format: ["PascalCase"],
        },
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: {
            regex: "^I[A-Z]",
            match: false,
          },
          failureMessage: "Interface names should not be prefixed with 'I'",
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
          custom: {
            regex: "^T[A-Z]",
            match: false,
          },
          failureMessage: "Type names should not be prefixed with 'T'",
        },
        {
          selector: "typeParameter",
          format: ["PascalCase"],
          prefix: ["T"],
        },
        {
          selector: "enum",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["UPPER_CASE", "PascalCase"],
        },
        {
          selector: "variable",
          modifiers: ["const", "global"],
          format: ["UPPER_CASE", "camelCase", "PascalCase"],
        },
        {
          // Allow snake_case for Prisma/database field names
          selector: ["objectLiteralProperty", "objectLiteralMethod"],
          format: null,
          filter: {
            regex: "^(person_id|role_id|competence_id|years_of_experience|from_date|to_date)$",
            match: true,
          },
        },
        {
          selector: ["objectLiteralProperty", "objectLiteralMethod"],
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: ["classProperty", "classMethod"],
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: ["classProperty", "classMethod"],
          modifiers: ["private"],
          format: ["camelCase"],
          leadingUnderscore: "require",
        },
        {
          selector: ["classProperty", "classMethod"],
          modifiers: ["protected"],
          format: ["camelCase"],
          leadingUnderscore: "require",
        },
        {
          selector: "variable",
          modifiers: ["destructured"],
          format: null,
        },
        {
          selector: "import",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
        {
          selector: [
            "classProperty",
            "objectLiteralProperty",
            "typeProperty",
            "classMethod",
            "objectLiteralMethod",
            "typeMethod",
            "accessor",
            "enumMember",
          ],
          format: null,
          modifiers: ["requiresQuotes"],
        },
      ],
    },
  },

  // 4. Global Language/Linter Options
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);