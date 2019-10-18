/* eslint camelcase: ['error', {allow: ['[a-z]*_token',
                                        'expires_in',
                                        'token_type',
                                        'grant_type',
                                        'redirect_uri']}] */

const OAuth2 = require('oauth').OAuth2
const moment = require('moment')

class OAuthClient {
  /**
   * @param {object} config
   */
  constructor (config = {}) {
    this._tokenInfo = {}
    this._redirect_uri = undefined
    this._tokenWillExpiredAt = undefined

    this.setRedirectUri(config.redirect_uri)
    this.setTokens(config)

    this.oauth = new OAuth2(
      config.client_id,
      config.secret,
      this.baseSite(),
      '/account/oauth',
      '/oauth/tokens'
    )
  }

  /**
   * @return {string}
   */
  baseSite () {
    return 'https://secure.indeed.com'
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
   * @param {object} config
   * @return {object|boolean}
   */
  setTokens (config) {
    var tokenInfo = {}
    const receivingKeys = this.tokenKeysWillReceive()

    receivingKeys.forEach((key) => {
      if (typeof config[key] !== 'undefined') {
        tokenInfo[key] = config[key]
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

module.exports = OAuthClient
