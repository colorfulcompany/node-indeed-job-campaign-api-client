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

  async clear () {
    throw new NotImplemented()
  }

  async renew (tokens) {
    throw new NotImplemented()
  }

  async access_token () {
    throw new NotImplemented()
  }

  async token_type () {
    throw new NotImplemented()
  }

  async updatedAt () {
    throw new NotImplemented()
  }
}

module.exports = OAuthTokenStoreBase
