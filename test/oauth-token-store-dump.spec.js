/* global describe, it, beforeEach */

const assert = require('power-assert')

const OAuthTokenStoreDumb = require('oauth-token-store-dumb')

describe('OAuthTokenStoreDumb', () => {
  let store

  beforeEach(async () => {
    store = new OAuthTokenStoreDumb()
    await store.renew({
      access_token: 'sdfghjkl',
      refresh_token: 'xcvbnm',
      token_type: 'Bearer'
    })
  })

  describe('#renew() and #access_token', () => {
    it('return empty string', async () => {
      assert(typeof (await store.access_token()) === 'string')
      assert((await store.access_token()).length === 0)
    })
  })

  describe('#renew() and #token_type', () => {
    it('return fixed string Bearer', async () => {
      assert.equal(await store.token_type(), 'Bearer')
    })
  })
})
