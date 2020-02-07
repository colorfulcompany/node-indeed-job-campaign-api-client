/* eslint camelcase: ['error', {allow: ['[a-z]*_token', 'token_type']}] */

const OAuthTokenStoreBase = require('./oauth-token-store-base')

class OAuthTokenStoreDumb extends OAuthTokenStoreBase {
  async clear () {}

  async renew (tokens) {}

  async access_token () { return '' }

  async token_type () { return 'Bearer' }

  async updatedAt () { return undefined }
}

module.exports = OAuthTokenStoreDumb
