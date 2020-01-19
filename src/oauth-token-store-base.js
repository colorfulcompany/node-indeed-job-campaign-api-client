/* eslint camelcase: ['error', {allow: ['[a-z]*_token', 'token_type']}] */

class NotImplemented extends Error {
  get name () { return 'NotImplemented' }
}

class OAuthTokenStoreBase {
  /**
   * @return {Array}
   */
  get keys () {
    return [
      'access_token',
      'expires_in',
      'token_type' // Indeed OAuth server alway receive and API server always require
    ]
  }

  clear () {
    throw new NotImplemented()
  }

  renew (tokens) {
    throw new NotImplemented()
  }

  access_token () {
    throw new NotImplemented()
  }

  token_type () {
    throw new NotImplemented()
  }
}

module.exports = OAuthTokenStoreBase
