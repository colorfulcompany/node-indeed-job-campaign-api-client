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
   * @param {object} config
   */
  constructor (config = {}) {
    this._tokenInfo = {}

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
   * @return {object|boolean}
   */
  setTokens (config) {
    const tokens = { token_type: this.defaultTokenType, ...config }

    var tokenInfo = {}
    const receivingKeys = this.tokenKeysWillReceive()

    receivingKeys.forEach((key) => {
      if (typeof tokens[key] !== 'undefined') {
        tokenInfo[key] = tokens[key]
      }
    })

    if (receivingKeys.length === Object.keys(tokenInfo).length) {
      this._tokenInfo = tokenInfo
      this.setTokenExpiresIn(tokenInfo.expires_in)

      return tokenInfo
    } else {
      return false
    }
  }

  /**
   * @param {number} expires_in
   * @return {moment|boolean}
   */
  setTokenExpiresIn (expires_in) {
    if (typeof expires_in !== 'number' || Number.isNaN(expires_in)) {
      return false
    } else {
      const expiredAt = this.now().add(expires_in, 'seconds')
      this._tokenWillExpiredAt = expiredAt

      return expiredAt
    }
  }

  /**
   * @return {object}
   */
  tokenWillExpiredAt () {
    return this._tokenWillExpiredAt
  }

  /**
   * @return {boolean}
   */
  isTokenExpired () {
    const willExpiredAt = this.tokenWillExpiredAt()

    return (willExpiredAt) ? this.now() > willExpiredAt : true
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
      token_type: this.tokenInfo.token_type,
      access_token: this.tokenInfo.access_token
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
        const RT = this.tokenInfo.refresh_token

        this.oauth.getOAuthAccessToken(
          RT,
          this.refreshParams,
          (err, access_token, none, results) => {
            if (err) {
              return reject(err)
            } else {
              const r = this.setTokens({ refresh_token: RT, ...results })
              r ? resolve(r) : reject(r)
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
