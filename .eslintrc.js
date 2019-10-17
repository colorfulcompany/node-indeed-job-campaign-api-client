module.exports = {
  extends: [
    'standard',
    'plugin:jsdoc/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-returns-description': 'off'
  },
  settings: {
    jsdoc: {
      tagNamePreference: {
        returns: 'return'
      }
    }
  }
}
