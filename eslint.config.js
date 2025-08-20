import fs from 'node:fs'
import path from 'node:path'
import globals from 'globals'
import js from '@eslint/js'
import vueParser from 'vue-eslint-parser'
import eslintVue from 'eslint-plugin-vue'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'

const getGlobals = () => {
  const base = { ...globals.browser }
  try {
    const autoPath = path.resolve(process.cwd(), '.eslintrc-auto-import.json')
    if (fs.existsSync(autoPath)) {
      const json = JSON.parse(fs.readFileSync(autoPath, 'utf8'))
      if (json?.globals) return { ...base, ...json.globals }
    }
  } catch {}
  return base
}

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'screenShoot.js',
      '.eslintrc-auto-import.json',
      'eslint.config.js',
      'auto-imports.d.ts'
    ]
  },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: getGlobals()
    },
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'warn'
    }
  },
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: tsParser, // 使用TS解析器
      parserOptions: {
        project: './tsconfig.json',
        extraFileExtensions: ['.vue'],
        sourceType: 'module'
      }
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: tseslint.configs.recommended.rules
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: {
          ts: tsParser, // 内层用 TS 解析器处理 <script lang="ts">
          js: 'espree' // 普通 JS 使用默认解析器
        },
        sourceType: 'module'
      }
    },
    plugins: { vue: eslintVue },
    rules: {
      ...eslintVue.configs['vue3-essential']?.rules,
      'no-debugger': 'off',
      'no-unused-vars': 'warn'
    }
  }
]
