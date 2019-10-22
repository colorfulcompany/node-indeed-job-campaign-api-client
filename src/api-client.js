const Swagger = require('swagger-client')
const ky = require('ky-universal')

class ApiClient {
  /**
   * @param {object} oauth
   * @param {object} opts
   */
  constructor (oauth = {}, opts = {}) {
    this.oauth = oauth
    this.opts = opts

    this.api = new Swagger({
      spec: this.apiSpec
    })
  }

  /**
   * @return {object}
   */
  get apiSpec () {
    if (typeof this.opts.specPath !== 'undefined') {
      return require(this.opts.specPath)
    } else {
      var url
      if (typeof this.opts.specUrl !== 'undefined') {
        url = this.opts.specUrl
      } else {
        url = 'https://opensource.indeedeng.io/api-documentation/docs/campaigns/api.json'
      }

      return (async () => {
        const res = await ky(url)
        return res.json()
      })()
    }
  }

  /**
   * @return {object}
   */
  async apis () {
    return new Promise((resolve, reject) => {
      this.api
        .then(client => resolve(client.apis))
        .catch(e => reject(e))
    })
  }

  /**
   * @return {object}
   */
  async employer () {
    return this.exec({ operationId: 'getEmployerInfo' })
  }

  /*
   * about client.execute
   */

  /**
   * execute wrapper with authorization header and retry
   *
   * @param {object} opts
   * @param {number} retry
   * @return {Promise}
   */
  async exec (opts, retry = this.defaultExecRetry) {
    return new Promise((resolve, reject) => {
      this.api
        .then(async (client) => {
          const r = await client.execute({ ...opts, ...this.httpOpts })
          resolve(r.data)
        }).catch(async (e) => {
          if (retry > 0 && this.isUnauthorized(e)) {
            retry--
            const wait = this.execRetryWait(retry)
            setTimeout(async () => {
              await this.oauth.sendRefreshToken()
              this.exec(opts, retry).then(resolve).catch(reject)
            }, wait)
          } else {
            return reject(e)
          }
        })
    })
  }

  /**
   * @return {number}
   */
  get defaultExecRetry () {
    return 3
  }

  /**
   * @param {number} retry
   * @return {number}
   */
  execRetryWait (retry) {
    const d = this.defaultExecRetry

    return ((d - retry > 0) ? (d - retry) : d) * 1000
  }

  /**
   * @param {Error} e
   * @return {boolean}
   */
  isUnauthorized (e) {
    return typeof e === 'object' && e.status === 401
  }

  /**
   * @return {object}
   */
  get httpOpts () {
    return {
      requestInterceptor: async (req) => {
        return this.addAuthorizationHeader(req)
      }
    }
  }

  /**
   * @param {object} req
   * @return {object}
   */
  async addAuthorizationHeader (req) {
    const t = await this.oauth.accessToken()

    req.headers = {
      ...req.headers,
      Authorization: [t.token_type, t.access_token].join(' ')
    }

    return req
  }
}

module.exports = ApiClient
