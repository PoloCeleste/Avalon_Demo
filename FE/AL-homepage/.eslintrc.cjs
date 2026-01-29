/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // 반드시 마지막에 배치(Prettier와 충돌하는 ESLint 규칙 비활성화)
  ],
  plugins: ['react', 'react-hooks', 'prettier'],
  rules: {
    'prettier/prettier': 'error', // Prettier 포맷을 ESLint 에러로 노출
    'react/react-in-jsx-scope': 'off', // Vite+React에서는 필요 없음
  },
}
