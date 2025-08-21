import js from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Ignore generated and third-party files
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'visual-diff/**',
      'public/snapshot/**',
      'public/**/*.min.js',
      'public/**/*.min_*.js',
      'public/**/*.vendor.js',
    ],
  },
  // Base recommended rules from ESLint
  js.configs.recommended,

  // Import plugin recommended rules
  {
    plugins: { import: pluginImport },
    rules: {
      ...(pluginImport.configs?.recommended?.rules || {}),
    },
  },

  // Disable rules that conflict with Prettier formatting
  prettier,

  // Project specifics
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Service worker globals
  {
    files: ['public/sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.serviceworker,
      },
    },
  },

  // Node scripts
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Visual compare script (mix of Node + browser globals)
  {
    files: ['scripts/visual-compare.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-empty': 'off',
    },
  },

  // Vite config runs in Node environment
  {
    files: ['vite.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
];
