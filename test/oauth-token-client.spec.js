/* global describe, it, beforeEach, afterEach */
/* eslint camelcase: ['error', {allow: ['[a-z]*_token',
                                        'expires_in',
                                        'token_type',
                                        'grant_type',
                                        'redirect_uri',
                                        'client_*']}] */

const assert = require('power-assert')
const sinon = require('sinon')
const moment = require('moment')
const { OAuth2Server } = require('oauth2-mock-server')

const ky = require('ky-universal')
const { mockResponseRefreshTokenSuccessfully } = require('./support/util')

const OAuthTokenClient = require('oauth-token-client')

describe('OAuthTokenClient', () => {
  const serverPort = 9876
  const serverHost = 'localhost'
  var client

  describe('with mock server', () => {
    let server

    /**
     * @return {object}
     */
    function paramForRefreshingToken () {
      return {
        client_id: 'y2w0i2pbsimq9hnaeu4hbbbi56axim88w458uxeb',
        client_secret: 'w7bf4x0twmigpw0t6mi8la9gel2iyj6dzridhzll',
        access_token: 'ELky5zO_iUZuf',
        refresh_token: 'YzecKCk5ApJgO',
        redirect_uri: 'http://localhost:4321',
        grant_type: 'refresh_token'
      }
    }

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
      server = new OAuth2Server()
      await server.issuer.keys.generateRSA()
      await server.start(serverPort, serverHost)
    })

    after(async () => { // eslint-disable-line no-undef
      await server.stop()
    })

    describe('refresh token ', () => {
      describe('just request with ky and response from mock server', () => {
        /**
         * @param {object} body
         * @return {object} - JSON.parsed ky response
         */
        async function validRefreshRequestWithKy (body) {
          return ky.post(
            `http://${serverHost}:${serverPort}/token`,
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
            mockResponseRefreshTokenSuccessfully(server)
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
    })
  })

  describe.skip('fetch indeed', () => {
    it('', async () => {
      client = new OAuthTokenClient({
        client_id: '',
        secret: '',
        redirect_uri: '',
        access_token: '',
        refresh_token: '',
        expires_in: 0
      })

      const token = await client.accessToken()
      assert.equal(typeof token, 'object')
    })
  })

  describe.skip('with sinon mock', () => {
    beforeEach(() => {
      client = new OAuthTokenClient({ client_id: '', secret: '', redirect_uri: '' })
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

    describe('#setExpiresIn', () => {
      var future = moment('2019-10-18T08:00:00').format()
      var duration = 3600

      beforeEach(() => {
        sinon.stub(client, 'now').callsFake(() => moment('2019-10-18T07:00:00'))
      })

      it('set seconds return new moment', () => {
        assert.equal(client.setTokenExpiresIn(duration).format(), future)
      })

      it('same value from #tokenwillexpiredat', () => {
        client.setTokenExpiresIn(duration)
        assert.equal(client.tokenWillExpiredAt().format(), future)
      })

      it('invalid args', () => {
        assert.equal(client.setTokenExpiresIn('abc'), false)
      })
    })

    describe('#isTokenExpired', () => {
      var m = moment

      /**
       * @param {object} pastTime
       * @param {number} duration
       */
      function setExpiredForPasttime (pastTime, duration) {
        sinon.stub(client, 'now').callsFake(() => pastTime)
        client.setTokenExpiresIn(duration)
        sinon.restore()
      }

      describe('token stored at 20min before, and expires_in 10min', () => {
        beforeEach(() => {
          setExpiredForPasttime(m('2019-10-17T12:00:00'), 600)
        })

        it('return true', () => {
          sinon.stub(client, 'now').callsFake(() => m('2019-10-17T12:20:00'))
          assert(client.isTokenExpired())
        })
      })

      describe('token stored at 10min before, and expires_in 20min', () => {
        beforeEach(() => {
          setExpiredForPasttime(m('2019-10-17T12:00:00'), 1200)
        })

        it('return false', () => {
          sinon.stub(client, 'now').callsFake(() => m('2019-10-17T12:10:00'))
          assert.equal(client.isTokenExpired(), false)
        })
      })

      describe('expiredAt prop is undefined', () => {
        it('always as expired', () => {
          assert(client.isTokenExpired())
        })
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
        it('return false', () => {
          assert.equal(client.setTokens({}), false)
        })
      })

      describe('partial', () => {
        it('return false', () => {
          assert.equal(
            client.setTokens({ access_token: '', refresh_token: '' }), false)
        })
      })

      describe('complete', () => {
        beforeEach(() => {
          sinon.mock(client).expects('setTokenExpiresIn').once()
        })
        afterEach(() => {
          sinon.restore()
        })
        it('return same data', () => {
          const tokenInfo = { access_token: '', refresh_token: '', token_type: '', expires_in: 600 }
          assert.deepEqual(client.setTokens(tokenInfo), tokenInfo)

          sinon.verify()
        })
      })

      describe('token_type prop has default', () => {
        beforeEach(() => {
          sinon.mock(client).expects('setTokenExpiresIn').once()
        })
        afterEach(() => {
          sinon.restore()
        })
        it('default token_type is Bearer', () => {
          const tokenInfo = { access_token: '', refresh_token: '', expires_in: 600 }
          assert.deepEqual(
            client.setTokens(tokenInfo),
            { access_token: '', refresh_token: '', token_type: 'Bearer', expires_in: 600 })

          sinon.verify()
        })
      })
    })
  })
})
