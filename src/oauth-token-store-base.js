/* eslint camelcase: ['error', {allow: ['[a-z]*_token']}] */

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
      'refresh_token',
      'expires_in'
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

  refresh_token () {
    throw new NotImplemented()
  }
}

module.exports = OAuthTokenStoreBase
