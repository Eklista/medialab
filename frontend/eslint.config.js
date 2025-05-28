import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Ignorar archivos generados automáticamente y de construcción
  { 
    ignores: [
      'dist/**',
      'dev-dist/**',  // ← AÑADIDO: esto elimina los errores de workbox
      'build/**',
      'coverage/**',
      '.nyc_output/**',
      '*workbox*.js',
      'sw.js',
      'service-worker.js',
      '*.config.js',
      '*.config.ts',
      'vite.config.*'
    ] 
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // Reglas TypeScript más permisivas para desarrollo
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      
      // Reglas JavaScript estándar
      'no-case-declarations': 'error',
      'no-empty-pattern': 'error',
      
      // Desactivar reglas problemáticas temporalmente
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
)