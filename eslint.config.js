import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  {
    ignores: [
      'build/**',
      '.react-router/**',
      'node_modules/**',
      'dist/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // React rules
      'react/jsx-uses-react': 'off', // Not needed in React 19
      'react/react-in-jsx-scope': 'off', // Not needed in React 19
      'react/prop-types': 'off', // Using TypeScript

      // React Hooks rules
      ...reactHooks.configs.recommended.rules,

      // React Refresh rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['meta', 'links', 'headers', 'loader', 'action'] },
      ],

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // Override for files that export utility hooks alongside components
  {
    files: [
      '**/ThemeProvider.tsx',
      '**/Form/Form.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Override for API routes and library files that need console for debugging
  {
    files: [
      'app/routes/api.*.ts',
      'app/**/lib/**/*.ts',
    ],
    rules: {
      'no-console': 'off', // Will be replaced with proper logging
    },
  },
  // Override for UI components using external libraries
  {
    files: [
      '**/Select/Select.tsx',
      '**/Table/Table.tsx',
    ],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // Override for controlled components that need to sync state in effects
  {
    files: [
      '**/InputNumber/InputNumber.tsx',
      '**/Tree/Tree.tsx',
    ],
    rules: {
      // These components need to sync controlled values in effects, which is a valid pattern
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // Override for logger utility to allow console methods
  {
    files: ['**/utils/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  }
);
