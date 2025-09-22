import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import stylistic from "@stylistic/eslint-plugin";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"]
  },
  {
    ignores: ["eslint.config.mjs", "**/coverage/**", "lib/**"]
  },
  {
    languageOptions: {
      parserOptions: {
          project: "./tsconfig.json",
            projectService: true,
            allowDefaultProject: true
      }
    },
},
  ...tseslint.config(
    pluginJs.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    importPlugin.flatConfigs.recommended,
    stylistic.configs.recommended
  ),
  {
    settings: {
      'import/resolver': {
          typescript: {
              project: './'
          },
          node: {
              'extensions': [".js", ".jsx", ".ts", ".tsx"]
          }
      },
    },
    rules: {
      'array-callback-return': 'error',
      'consistent-return': 'error',
      'curly': 'error',
      'complexity': 'error',
      'func-style': ['error', 'declaration'],
      'no-console': ['warn'],
      'no-else-return': 'error',
      'no-eq-null': 'error',
      'no-inline-comments': 'error',
      'no-lone-blocks': 'error',
      'no-lonely-if': 'error',
      'no-nested-ternary': 'error',
      'no-new': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'no-unused-expressions': 'error',
      'max-depth': ['error', 4],
      'max-params': ['error', 2],
      'object-shorthand': 'error',
      'prefer-object-spread': 'error',
      'prefer-template': 'error',
      'sort-imports': [
          'error',
          {
              'ignoreDeclarationSort': true, 
              'ignoreCase': true
          }
      ],
      'no-restricted-imports': ['error', {
            patterns: [
                {
                    group: ['.*'],
                    message: 'Do not use relative imports, use @alisases instead'
                },
                {
                    group: ['@toolbox/logger'],
                    message: "Use @logger instead of @toolbox/logger"
                }
            ]
      }],
      'yoda': [
          'error',
          'never'
      ],
      'import/first': 'error',
      'import/extensions': 2,
      'import/exports-last': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-unassigned-import': 'error',
      'import/no-dynamic-require': 'error',
      'import/order': [
        'error', {
            'newlines-between': 'always',
          pathGroups: [
              {
                pattern: '@testrail-api/**',
                group: 'internal',
                position: 'before'
              },
              {
                pattern: '@reporter/**',
                group: 'internal',
                position: 'before'
              },
              {
                pattern: '@types-internal/**',
                group: 'internal',
                position: 'before'
              },
              {
                pattern: '@test-data/**',
                group: 'internal',
                position: 'before'
              },
              {
                pattern: '@(logger|toolbox)/**',
                group: 'internal',
                position: 'before'
              }
            ],
            groups: [
                'builtin',
                'external',
                'internal',
                'object'
            ],
            alphabetize: {
                order: 'asc',
                caseInsensitive: true
            }
        }
    ],
      '@stylistic/indent': ["error", 4],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/eol-last': ['error', 'never'],
      '@stylistic/member-delimiter-style': [
          "error",
          {
            multiline: {
              delimiter: "comma",
              requireLast: false,
            },
            singleline: {
              delimiter: "comma",
              requireLast: false,
            },
          }
      ],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
      '@stylistic/object-curly-spacing': ['error', 'always', { objectsInObjects: true }],
      '@stylistic/padding-line-between-statements': [
          "error",
          {
              blankLine: "always",
              prev: "*",
              next: ["enum", "interface", "type"]
          },
          { blankLine: "always", prev: "block-like", next: "export" },
          { blankLine: "always", prev: "export", next: "block-like" }
      ],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-non-null-assertion': ['off'],
      '@typescript-eslint/restrict-template-expressions': ['off'],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@stylistic/max-statements-per-line': ['error', { max: 2 }],
      '@typescript-eslint/naming-convention': [
          'error',
          {
              selector: 'default',
              format: ['camelCase'],
              leadingUnderscore: 'allow'
          },
          {
              selector: "variable",
              modifiers: ["const"],
              format: ["UPPER_CASE", 'camelCase']
          },
          {
              selector: ['class', 'typeLike'],
              format: ['PascalCase']
          },
          {
              selector: ['objectLiteralProperty'],
              format: null
          }
      ],
      '@typescript-eslint/no-base-to-string': 'off'
    }
  }
];