// Shared ESLint flat-config building blocks. Apps import and spread these
// into their own eslint.config.js rather than duplicating rule sets.
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

const base = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', 'generated/**'],
  },
];

// React + accessibility rules — used by ops-portal, client-portal, and packages/ui.
// jsx-a11y is not optional here: it is the first line of defense for the
// WCAG AA+ requirement, catching missing alt text, invalid ARIA, non-interactive
// elements with click handlers, etc. at lint time instead of in manual QA.
function withReactA11y(existing) {
  const react = require('eslint-plugin-react');
  const reactHooks = require('eslint-plugin-react-hooks');
  const jsxA11y = require('eslint-plugin-jsx-a11y');
  return [
    ...existing,
    {
      plugins: {
        react,
        'react-hooks': reactHooks,
        'jsx-a11y': jsxA11y,
      },
      rules: {
        ...react.configs.recommended.rules,
        ...reactHooks.configs.recommended.rules,
        ...jsxA11y.configs.strict.rules,
        'react/react-in-jsx-scope': 'off',
      },
      settings: {
        react: { version: 'detect' },
      },
    },
  ];
}

module.exports = { base, withReactA11y };
