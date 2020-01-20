/* global describe, it, beforeEach */
/* eslint camelcase: ['error', {allow: ['[a-z]*_token',
                                        'expires_in',
                                        'token_type',
                                        'grant_type',
                                        'redirect_uri',
                                        'client_*']}] */

const path = require('path')
const assert = require('power-assert')

const ky = require('ky-universal')
const {
  mockResponseRefreshTokenSuccessfully,
  paramForRefreshingToken,
  createOAuthClient
} = require('./support/util')
const OAuthTokenClient = require('oauth-token-client')
const OAuth2MockServerController = require('./support/oauth2-mock-server-controller')

const OAuthTokenStorePlainFile = require('oauth-token-store-plain-file')
const OAuthTokenStoreDumb = require('oauth-token-store-dumb')

class TestingOAuthTokenStore extends OAuthTokenStoreDumb {
  access_token () { return 'ELky5zO_iUZuf' }
}

describe('OAuthTokenClient', () => {
  var client

  describe('with mock server', () => {
    let mockController

    /**
     * @return {object}
     */
    function queryAsRefreshToken () {
      const search = new URLSearchParams()
      const params = paramForRefreshingToken()
      for (const key in params) {
        if (key === 'redirect_uri') {
          search.set(key, encodeURIComponent(params[key]))
        } else {
          search.set(key, params[key])
        }
      }

      return search
    }

    before(async () => { // eslint-disable-line no-undef
      mockController = new OAuth2MockServerController()
      await mockController.start()
    })
    after(async () => { // eslint-disable-line no-undef
      await mockController.stop()
    })

    beforeEach(() => {
      client = createOAuthClient(new TestingOAuthTokenStore(), mockController.host, mockController.port)
    })

    describe('refresh token ', () => {
      describe('just request with ky and response from mock server', () => {
        /**
         * @param {object} body
         * @return {object} - JSON.parsed ky response
         */
        async function validRefreshRequestWithKy (body) {
          return ky.post(
            `http://${mockController.host}:${mockController.port}/token`,
            {
              body,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json'
              }
            }
          )
            .json()
        }

        describe('refresh_token request successfully', () => {
          beforeEach(() => {
            mockResponseRefreshTokenSuccessfully(mockController.server)
          })

          it('fetch token successfully with ky', async () => {
            const tokens = await validRefreshRequestWithKy(queryAsRefreshToken())
            const responseKeys = Object.keys(tokens)
            assert(
              ['access_token', 'convid', 'token_type'].every((key) => {
                return responseKeys.indexOf(key) >= 0
              })
            )
          })
        })
      })

      describe('refresh with OAuthTokenClient', () => {
        beforeEach(() => {
          mockResponseRefreshTokenSuccessfully(mockController.server)
        })

        it('receive tokens but except convid', async () => {
          const tokens = await client.sendRefreshToken()
          const responseKeys = Object.keys(tokens)
          assert(
            ['access_token', 'expires_in', 'token_type'].every((key) => responseKeys.indexOf(key) >= 0)
          )
        })
      })
    })

    describe('#setRedirectUri', () => {
      describe('string', () => {
        var uri = ''

        it('return same string', () => {
          assert.equal(client.setRedirectUri(uri), uri)
        })

        it('can get also redirect_uri prop', () => {
          client.setRedirectUri(uri)
          assert.equal(client.redirect_uri, uri)
        })
      })

      it('undefined', () => {
        assert.equal(client.setRedirectUri(undefined), false)
      })
    })

    describe('#tokenKeysWillReceive', () => {
      it('return array', () => {
        assert(Array.isArray(client.tokenKeysWillReceive()))
      })
    })

    describe('#tokenKeysMustSend', () => {
      it('return array', () => {
        assert(Array.isArray(client.tokenKeysMustSend()))
      })
    })

    describe('#setTokens', () => {
      describe('empty', () => {
        it('return always undefined and accessToken() from store', async () => {
          assert.equal(client.setTokens({}), undefined)
          assert.deepEqual(
            await client.accessToken(),
            {
              token_type: 'Bearer',
              access_token: 'ELky5zO_iUZuf'
            })
        })
      })
    })
  })

  describe.skip('fetch indeed', () => {
    it('', async () => {
      client = new OAuthTokenClient(new OAuthTokenStorePlainFile(path.join(__dirname, '../tmp/token-store.json')))

      const token = await client.accessToken()
      assert.equal(typeof token, 'object')
    })
  })
})
