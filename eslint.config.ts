import js from "@eslint/js"
import stylistic from "@stylistic/eslint-plugin"
import { flatConfigs as importFlatConfigs } from "eslint-plugin-import-x"
import reactPlugin from "eslint-plugin-react"
import reactHooksPlugin from "eslint-plugin-react-hooks"
import globals from "globals"
import { config as tsConfig, configs as tsConfigs } from "typescript-eslint"

const FEATURES = ["account", "friend", "dog", "walk"] as const

/** Cross-feature `presentation`/`infrastructure` imports are forbidden — see CLAUDE.md
 * "Règle de dépendance". A feature may depend on another feature's `domain`/`application`
 * (e.g. `walk` → `dog`), never its `presentation` or `infrastructure`. */
const crossFeatureZones = FEATURES.flatMap((feature) => {
  const others = FEATURES.filter((other) => other !== feature)
  return [
    {
      target: `./src/${feature}/presentation/**`,
      from: others.flatMap((other) => [`./src/${other}/presentation/**`, `./src/${other}/infrastructure/**`]),
      message: `${feature}/presentation ne peut pas importer la presentation/infrastructure d'une autre feature — seulement son domain/application (voir CLAUDE.md).`,
    },
    {
      target: `./src/${feature}/infrastructure/**`,
      from: others.flatMap((other) => [`./src/${other}/presentation/**`, `./src/${other}/infrastructure/**`]),
      message: `${feature}/infrastructure ne peut pas importer une autre feature — passer par le domain/application de cette feature.`,
    },
  ]
})

/** `domain → application → presentation` and `domain ← infrastructure` within a feature — the
 * domain never imports outward, application never imports infrastructure/presentation
 * directly (only shared/di/container.ts wires concrete repositories in). */
const layerZones = [
  {
    target: "./src/*/domain/**",
    from: ["./src/*/application/**", "./src/*/infrastructure/**", "./src/*/presentation/**"],
    message: "domain/ doit rester du TypeScript pur — jamais d'import vers application/infrastructure/presentation.",
  },
  {
    target: "./src/*/application/**",
    from: ["./src/*/infrastructure/**", "./src/*/presentation/**"],
    message: "application/ ne doit jamais importer infrastructure/presentation directement — le câblage passe par shared/di/container.ts.",
  },
  {
    target: "./src/*/infrastructure/**",
    from: ["./src/*/presentation/**"],
    message: "infrastructure/ ne doit jamais importer presentation/.",
  },
]

export default tsConfig(
  {
    ignores: ["node_modules/**", ".expo/**", "dist/**", "supabase/functions/**", "docs/design-system/**", "expo-env.d.ts"],
  },

  {
    name: "rules/files-to-lint",
    files: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}", "scripts/**/*.mjs", "eslint.config.ts"],
  },

  js.configs.recommended,

  tsConfigs.recommended,

  {
    name: "rules/react",
    files: ["app/**/*.tsx", "src/**/*.tsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: { version: "19.2" },
    },
    languageOptions: {
      globals: { ...globals.browser, __DEV__: "readonly" },
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // The whole app is French copy with apostrophes in JSX text ("Tu n'as pas encore
      // d'ami...") — this rule would flag nearly every screen for no real gain here.
      "react/no-unescaped-entities": "off",
      // Downgraded, not disabled: this repo has a few legitimate "hydrate form fields once
      // async query data loads" effects (ProfileSettingsScreen, DogFormScreen, WalkEditScreen)
      // that the rule can't distinguish from a genuine derived-state bug — worth a second
      // look case by case, not a hard failure.
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  {
    name: "rules/scripts",
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    // Metro (RN's bundler) resolves static asset requires (fonts, images) at bundle time —
    // `require()` is the documented Expo pattern for `useFonts`, not a CommonJS holdover.
    name: "rules/metro-asset-requires",
    files: ["app/_layout.tsx"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Import plugin configuration
  importFlatConfigs.recommended,
  importFlatConfigs.typescript as never,

  {
    name: "rules/import",
    settings: {
      "import-x/resolver": {
        typescript: true,
      },
    },
    rules: {
      "import-x/no-duplicates": ["error", { "prefer-inline": true }],
      "import-x/newline-after-import": ["error", { count: 1 }],
      "import-x/no-unresolved": "off",
      "import-x/first": "error",
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "unknown", "parent", "sibling", "index", "object", "type"],
          "newlines-between": "always",
          distinctGroup: false,
          alphabetize: { order: "asc", caseInsensitive: false },
        },
      ],
      "import-x/no-restricted-paths": [
        "error",
        { zones: [...crossFeatureZones, ...layerZones] },
      ],
    },
  },

  {
    name: "rules/typescript",
    rules: {
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { args: "after-used", argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },

  {
    name: "rules/javascript",
    rules: {
      "block-scoped-var": "error",
      "no-else-return": "error",
      "no-eval": "error",
      "no-extra-bind": "warn",
      "no-implied-eval": "error",
      "no-lonely-if": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],
      "no-sequences": "error",
      "no-unused-vars": "off",
      "no-useless-call": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "prefer-arrow-callback": "warn",
      "prefer-const": ["warn", { destructuring: "all" }],
      "prefer-rest-params": "warn",
      "prefer-spread": "warn",
      "prefer-template": "warn",
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },

  {
    name: "rules/stylistic",
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/semi": ["error", "never"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/quotes": ["error", "double", { avoidEscape: true, allowTemplateLiterals: "always" }],
      "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: true }],
      "@stylistic/space-before-blocks": ["error", "always"],
      "@stylistic/space-in-parens": ["error", "never"],
      "@stylistic/space-infix-ops": "error",
      "@stylistic/space-before-function-paren": ["error", "never"],
      "@stylistic/function-call-spacing": ["error", "never"],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/array-bracket-spacing": ["error", "never", { singleValue: false }],
      "@stylistic/comma-spacing": ["error", { before: false, after: true }],
      "@stylistic/comma-style": ["error", "last"],
      "@stylistic/linebreak-style": ["error", "unix"],
      "@stylistic/keyword-spacing": ["error", { before: true, after: true }],
      "@stylistic/key-spacing": ["error", { beforeColon: false, afterColon: true }],
      "@stylistic/eol-last": ["error", "always"],
      "@stylistic/no-multiple-empty-lines": ["error", { max: 1 }],
    },
  },
)
