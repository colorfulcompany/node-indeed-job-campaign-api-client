const path = require('path')
const Swagger = require('swagger-client')
const ky = require('ky-universal')

class ApiClientExecError extends Error {
  get name () { return 'ApiClientExecError' }
}

class ApiClient {
  /**
   * @param {object} oauth
   * @param {object} opts
   */
  constructor (oauth = {}, opts = {}) {
    this.oauth = oauth
    this.opts = opts
    this.api = undefined
  }

  /**
   * @param {object} oauth
   * @param {object} opts
   * @return {ApiClient}
   */
  static async create (oauth = {}, opts = { specPath: path.join(__dirname, '../spec/api.json') }) {
    const client = new this(oauth, opts)

    client.setSwagger(new Swagger({
      spec: await client.resolveSpec()
    }))

    return client
  }

  /**
   * @param {object} swagger
   */
  setSwagger (swagger) {
    this.api = swagger
  }

  /**
   * @return {object}
   */
  async resolveSpec () {
    if (typeof this.opts.specPath !== 'undefined') {
      return require(this.opts.specPath)
    } else {
      var url
      if (typeof this.opts.specUrl !== 'undefined') {
        url = this.opts.specUrl
      } else {
        url = 'https://opensource.indeedeng.io/api-documentation/docs/campaigns/api.json'
      }

      const res = await ky(url)
      return res.json()
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
   * @return {string} - JSON string
   */
  async exec (opts, retry = this.defaultExecRetry) {
    return new Promise((resolve, reject) => {
      this.api
        .then(async (client) => {
          const r = await client.execute({ ...opts, ...this.httpOpts })
          resolve(r.data)
        }).catch(async (e) => {
          if (this.isNotFound(e)) {
            resolve(e.response.text)
          } else if (retry > 0) {
            console.debug(JSON.stringify({
              message: `retrying Indeed API ... rest ${retry}`,
              requestOpts: opts,
              responseHeaders: e.headers
            }))
            retry--

            if (this.isUnauthorized(e)) await this.oauth.sendRefreshToken()
            const wait = this.execRetryWait(retry)
            setTimeout(async () => {
              this.exec(opts, retry).then(resolve).catch(reject)
            }, wait)
          } else {
            const err = new ApiClientExecError()
            err.req = opts
            err.swaggerError = e
            return reject(err)
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
   * @param {Error} e
   * @return {boolean}
   */
  isNotFound (e) {
    return typeof e === 'object' && e.status === 404
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
