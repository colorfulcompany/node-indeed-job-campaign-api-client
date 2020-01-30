/* global describe, it, beforeEach, afterEach */
const path = require('path')
const fs = require('fs')
const assert = require('power-assert')
const sinon = require('sinon')

const OAuth2MockServerController = require('./support/oauth2-mock-server-controller')
const OAuthTokenStoreDumb = require('oauth-token-store-dumb')

const OAuthTokenStorePlainFile = require('oauth-token-store-plain-file')

const OAuthTokenClient = require('oauth-token-client')
const ApiClient = require('api-client')

const {
  oauthClientOpts, // eslint-disable-line
  localDummyClientSpec, // eslint-disable-line
  productionClientSpec, // eslint-disable-line
  createOAuthClient
} = require(path.join(__dirname, 'support/util'))

describe('ApiClient', () => {
  var mockController, client, oauth

  before(async () => { // eslint-disable-line no-undef
    mockController = new OAuth2MockServerController()
    await mockController.start()
  })
  after(async () => { // eslint-disable-line no-undef
    await mockController.stop()
  })

  beforeEach(async () => {
    oauth = createOAuthClient(new OAuthTokenStoreDumb(), mockController.host, mockController.port)
    client = await ApiClient.create(oauth, { specPath: localDummyClientSpec() })
  })

  /**
   * @param {string} name
   * @param {object} data
   */
  function writeFile (name, data) { // eslint-disable-line no-unused-vars
    const dest = path.join(__dirname, `support/${name}.json`)
    fs.writeFileSync(dest, data)
  }

  describe.skip('fetch indeed', function () {
    this.timeout(10000)

    beforeEach(async () => {
      oauth = new OAuthTokenClient(new OAuthTokenStorePlainFile(path.join(__dirname, '../tmp/token-store.json')))
    })

    it('', async () => {
      client = await ApiClient.create(oauth, {}) // force fetch spec from remote
      console.log(await client.apis())
      console.log(await client.employer())
    })
  })

  describe('#apis', () => {
    it('return object', async () => {
      assert.equal(typeof await client.apis(), 'object')
    })

    it('multiple entries', async () => {
      assert(Object.entries(await client.apis()).length > 0)
    })
  })

  describe('#exec', () => {
    afterEach(async () => {
      sinon.restore()
    })

    describe('execute error occured', () => {
      var spyIsUnthorized

      beforeEach(async () => {
        const e = new Error()
        e.status = 401

        sinon.stub(client, 'api').get(() => {
          return Promise.reject(e)
        })
        // prepare retrying
        spyIsUnthorized = sinon.spy(client, 'isUnauthorized')
        sinon.mock(client).expects('execRetryWait').atLeast(1).returns(0)
        sinon.stub(client.oauth, 'sendRefreshToken').callsFake(() => {})
      })

      it('ApiclientExecError', () => {
        assert.rejects(
          async () => client.exec({}),
          { name: 'ApiClientExecError' }
        )
      })

      it('rejected and retried ', async () => {
        try {
          await client.exec({})
        } catch (e) {
          assert.deepEqual(e.req, {})
          assert.equal(e.swaggerError.status, 401)
          assert(spyIsUnthorized.called)
        }
        sinon.verify()
      })
    })

    describe('success', () => {
      var result = {
        data: { message: 'ok' }
      }

      beforeEach(async () => {
        sinon.stub(client, 'api').get(() => {
          return Promise.resolve({
            async execute () { return result }
          })
        })
        sinon.mock('isUnauthorized').never()
        sinon.mock('execRetryWait').never()
      })

      it('return only data prop', async () => {
        assert.deepEqual(await client.exec({}), result.data)
        sinon.verify()
      })
    })
  })

  describe('#execRetryWait', () => {
    beforeEach(() => { // fixed
      sinon.stub(client, 'defaultExecRetry').returns(3)
    })

    it('remaining retry number is 2, then wait 1000 ms', () => {
      assert.equal(client.execRetryWait(2), 1000)
    })

    it('remaining retry number is 1, then wait 2000 ms', () => {
      assert.equal(client.execRetryWait(1), 2000)
    })
  })

  describe('#isUnauthorized', () => {
    it('status is 401', () => {
      assert(client.isUnauthorized({ status: 401 }))
    })

    it('status is missing', () => {
      assert.equal(client.isUnauthorized({}), false)
    })

    it('not object', () => {
      assert.equal(client.isUnauthorized(), false)
    })
  })

  describe('#httpOpts', () => {
    it('has requestInterceptor prop', () => {
      assert.deepEqual(Object.keys(client.httpOpts), ['requestInterceptor'])
    })
  })

  describe('#addAuthorizationHeader', () => {
    beforeEach(() => {
      sinon.stub(oauth, 'accessToken').callsFake(async () => {
        return {
          access_token: 'abc',
          token_type: 'Bearer'
        }
      })
    })

    afterEach(() => sinon.restore())

    it('accept request object and add headers prop', async () => {
      assert.deepEqual(
        await client.addAuthorizationHeader({}),
        {
          headers: { Authorization: 'Bearer abc' }
        }
      )
    })

    it('accept request object and update headers prop', async () => {
      assert.deepEqual(
        await client.addAuthorizationHeader({ headers: { 'user-agent': 'ua' } }),
        {
          headers: {
            Authorization: 'Bearer abc',
            'user-agent': 'ua'
          }
        }
      )
    })
  })
})
