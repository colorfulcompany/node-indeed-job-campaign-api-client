/* eslint camelcase: ['error', {allow: ['[a-z]*_token', 'token_type']}] */

const OAuthTokenStoreBase = require('./oauth-token-store-base')

class OAuthTokenStoreDumb extends OAuthTokenStoreBase {
  clear () {}

  renew (tokens) {}

  access_token () { return '' }

  token_type () { return 'Bearer' }

  get updatedAt () { return undefined }
}

module.exports = OAuthTokenStoreDumb
