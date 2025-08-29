module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  
  extends: [
    'eslint:recommended'
  ],
  
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  
  globals: {
    // PDF-lib global
    PDFLib: 'readonly',
    
    // Application globals
    __DEV__: 'readonly',
    __VERSION__: 'readonly',
    
    // Analytics globals
    gtag: 'readonly',
    dataLayer: 'readonly'
  },
  
  rules: {
    // ES6+ specific rules
    'prefer-const': 'error',
    'prefer-arrow-functions': 'off',
    'no-var': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    
    // Import/Export rules
    'no-duplicate-imports': 'error',
    
    // General code quality
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    
    // Code style
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Function rules
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'prefer-arrow-callback': 'error',
    
    // Async/await rules
    'require-await': 'error',
    'no-async-promise-executor': 'error',
    
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Performance rules
    'no-loop-func': 'error',
    'no-inner-declarations': 'error'
  },
  
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
        vitest: true
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly'
      }
    }
  ]
};