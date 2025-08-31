module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    requireConfigFile: false, // This is important if your babel.config.js is not in the root or is named differently
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: {
      classFields: true
    },
    babelOptions: {
      presets: ["@babel/preset-env"]
    }
  },
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  globals: {
    __DEV__: 'readonly',
    gtag: 'readonly',
    dataLayer: 'readonly',
    PDFLib: 'readonly',
    vi: 'readonly'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-unused-vars': 'warn',
    'no-prototype-builtins': 'off',
    'no-case-declarations': 'error'
  }
};