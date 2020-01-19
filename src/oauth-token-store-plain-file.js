/* eslint camelcase: ['error', {allow: ['[a-z]*_token', 'token_type']}] */
const OAuthTokenStoreBase = require('./oauth-token-store-base')
const fs = require('fs')
const moment = require('moment')

/*
 * OAuth Token Store as Plain File
 */
class OAuthTokenStorePlainFile extends OAuthTokenStoreBase {
  /**
   * @param {string} path
   */
  constructor (path) {
    super()
    this.path = path
  }

  clear () {
    this.renew({})
  }

  /**
   * @param {object} tokens
   * @param {object} updatedAt
   * @return {void}
   */
  renew (tokens, updatedAt = moment()) {
    const data = { updatedAt }
    this.keys.forEach((key) => {
      data[key] = tokens[key]
    })

    fs.writeFileSync(this.path, JSON.stringify(data))
  }

  /**
   * @return {string|undefined}
   */
  get access_token () {
    const props = this.load()
    const updatedAt = this.updatedAt
    const m = moment

    if (props && typeof props.access_token !== 'undefined') {
      if (updatedAt && typeof props.expires_in !== 'undefined' &&
          m() < m.utc(m.utc(updatedAt) + m.unix(props.expires_in))) {
        return props.access_token
      }
    }
  }

  /**
   * @return {string|undefined}
   */
  get token_type () {
    const props = this.load()

    if (props && typeof props.token_type !== 'undefined') return props.token_type
  }

  /**
   * @return {object|undefined}
   */
  load () {
    try {
      const contents = fs.readFileSync(this.path).toString()
      return JSON.parse(contents)
    } catch (e) {
      return undefined
    }
  }

  /**
   * @return {object|undefined}
   */
  get updatedAt () {
    const props = this.load()
    if (props && typeof props.updatedAt !== 'undefined') {
      return moment.utc(props.updatedAt)
    } else {
      return undefined
    }
  }
}

module.exports = OAuthTokenStorePlainFile
