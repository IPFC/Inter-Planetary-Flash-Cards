module.exports = {
  root: true,
  env: {
    node: true,
    // browser: true,
  },
  extends: [
    'plugin:vue/recommended',
    'standard',
    'eslint:recommended',
    'plugin:prettier/recommended',
    'prettier/vue',
  ],
  // required to lint *.vue files
  plugins: ['vue'],
  rules: {
    // allow async-await
    'generator-star-spacing': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: 'babel-eslint',
  },
};
