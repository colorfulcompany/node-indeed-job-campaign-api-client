/* eslint camelcase: ['error', {allow: ['[a-z]*_token',
                                        'client_*',
                                        'expires_in',
                                        'token_type',
                                        'grant_type',
                                        'redirect_uri']}] */

const OAuth2 = require('oauth').OAuth2
const moment = require('moment')

class OAuthTokenClient {
  /**
   * @param {object} store
   * @param {object} config
   */
  constructor (store = {}, config = {}) {
    this._store = store

    this._refresh_token = undefined
    this._redirect_uri = undefined
    this.setRedirectUri(config.redirect_uri)

    this._tokenWillExpiredAt = undefined

    const opts = {
      ...this.defaultConfig,
      ...config
    }
    this.setTokens(opts)

    this.oauth = new OAuth2(
      opts.client_id,
      opts.client_secret,
      opts.baseSite,
      opts.authorizePath,
      opts.accessTokenPath
    )
  }

  /**
   * @return {object}
   */
  get store () {
    return this._store
  }

  /**
   * @return {object}
   */
  get defaultConfig () {
    return {
      client_id: process.env.INDEED_CLIENT_ID,
      client_secret: process.env.INDEED_CLIENT_SECRET,
      access_token: process.env.INDEED_ACCESS_TOKEN,
      refresh_token: process.env.INDEED_REFRESH_TOKEN,
      redirect_uri: process.env.INDEED_REDIRECT_URI || 'http://localhost:4321', // required in Indeed Auth API,
      expires_in: 3600,
      baseSite: 'https://secure.indeed.com',
      authorizePath: '/account/oauth',
      accessTokenPath: '/oauth/tokens'
    }
  }

  /**
   * @return {string|undefined}
   */
  get refresh_token () {
    return this._refresh_token
  }

  /**
   * @return {object}
   */
  now () {
    return moment()
  }

  /**
   * @param {string} uri
   * @return {string|boolean}
   */
  setRedirectUri (uri) {
    if (typeof uri === 'string') {
      this._redirect_uri = uri

      return uri
    } else {
      return false
    }
  }

  /**
   * @return {string|undefined}
   */
  get redirect_uri () {
    return this._redirect_uri
  }

  /**
   * @return {object}
   */
  get tokenInfo () {
    return this._tokenInfo
  }

  /**
   * @return {Array}
   */
  tokenKeysWillReceive () {
    return `
access_token
refresh_token
expires_in
token_type
`.trim().split('\n')
  }

  /**
   * @return {Array}
   */
  tokenKeysMustSend () {
    // client_id, client_secret, refresh_token, grant_type will be sent automatically
    return `
redirect_uri
`.trim().split('\n')
  }

  /**
   * @return {string}
   */
  get defaultTokenType () {
    return 'Bearer'
  }

  /**
   * @param {object} config
   * @return {undefined}
   */
  setTokens (config) {
    const tokens = { token_type: this.defaultTokenType, ...config }

    const tokenInfo = {}
    const receivingKeys = this.tokenKeysWillReceive()

    receivingKeys.forEach((key) => {
      if (typeof tokens[key] !== 'undefined') {
        if (key === 'refresh_token') this._refresh_token = tokens[key]
        tokenInfo[key] = tokens[key]
      }
    })
    this.store.renew(tokenInfo)
  }

  /**
   * @return {boolean}
   */
  isTokenExpired () {
    return this.store.updatedAt && !this.store.access_token
  }

  /**
   * @return {object}
   */
  async accessToken () {
    // need retry ?
    if (this.isTokenExpired()) {
      await this.sendRefreshToken()
    }

    return {
      token_type: this.store.token_type,
      access_token: this.store.access_token
    }
  }

  /**
   * @return {object}
   */
  get refreshParams () {
    return {
      grant_type: 'refresh_token',
      redirect_uri: this.redirect_uri
    }
  }

  async sendRefreshToken () {
    return new Promise((resolve, reject) => {
      try {
        const RT = this.refresh_token

        this.oauth.getOAuthAccessToken(
          RT,
          this.refreshParams,
          (err, access_token, none, results) => {
            if (err) {
              return reject(err)
            } else {
              this.setTokens({ refresh_token: RT, ...results })
              resolve(results)
            }
          }
        )
      } catch (e) {
        return reject(e)
      }
    })
  }
}

module.exports = OAuthTokenClient
