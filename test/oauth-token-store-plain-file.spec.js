/* global describe, it, beforeEach */
/* eslint camelcase: ['error', {allow: ['[a-z]*_token',
                                        'expires_in']}] */

const path = require('path')
const fs = require('fs')
const sleep = require('sleep-promise')
const moment = require('moment')
const assert = require('power-assert')

const OAuthTokenStorePlainFile = require('oauth-token-store-plain-file')

describe('OAuthTokenStorePlainFile', () => {
  const storePath = path.join(__dirname, '../tmp/token-store.json')
  let store

  /**
   * @param {number} expires_in
   * @return {object}
   */
  function tokenInfos (expires_in = 3600) {
    return {
      access_token: 'qMzU-NFsxbf',
      refresh_token: 'DMLHvas77H3',
      expires_in
    }
  }

  /** @return {void} */
  function unlinkStore () {
    try {
      fs.unlinkSync(storePath)
    } catch (e) {
    }
  }

  beforeEach(() => {
    unlinkStore()
    store = new OAuthTokenStorePlainFile(storePath)
  })

  describe('#clear()', () => {
    beforeEach(() => {
      store.renew(tokenInfos())
    })
    it('only updatedAt prop exists', () => {
      store.clear()
      assert.deepEqual(Object.keys(store.load()), ['updatedAt'])
    })
  })

  describe('#renew()', () => {
    describe('not yet', () => {
      it('load() return undefined', () => {
        assert.equal(store.load(), undefined)
      })
    })
    describe('once', () => {
      beforeEach(() => {
        store.renew(tokenInfos())
      })
      it('return object', () => {
        assert.equal(typeof store.load(), 'object')
      })
    })
    describe('twice', () => {
      let updatedAt
      beforeEach(async () => {
        store.renew(tokenInfos())
        updatedAt = moment(store.load().updatedAt) // clone
        await sleep(100)
        store.renew(tokenInfos())
      })
      it('updatedAt has been chaged', () => {
        assert(updatedAt < store.updatedAt)
      })
    })
  })

  describe('#access_token()', () => {
    describe('before renew', () => {
      it('return undefined', () => {
        assert.equal(store.access_token, undefined)
      })
    })

    describe('before expired', () => {
      beforeEach(() => {
        store.renew(tokenInfos())
      })
      it('can fetch access_token', () => {
        assert(store.access_token)
      })
    })

    describe('after expired', () => {
      beforeEach(async () => {
        store.renew({
          ...tokenInfos({ expires_in: 10 })
        })
        await sleep(50)
      })
      it('return undefined', async () => {
        assert.equal(store.access_token, undefined)
      })
    })
  })

  describe('#refresh_token()', () => {
    describe('before renew', () => {
      it('return undefined', () => {
        assert.equal(store.refresh_token, undefined)
      })
    })

    describe('after renew', () => {
      beforeEach(() => {
        store.renew(tokenInfos({ expires_in: 50 }))
      })

      describe('before expired', () => {
        it('return string', () => {
          assert.equal(typeof store.refresh_token, 'string')
        })
      })

      describe('after 50ms expired', () => {
        it('return string', async () => {
          await sleep(100)
          assert.equal(typeof store.refresh_token, 'string')
        })
      })

      describe('after clear', () => {
        it('return refresh', () => {
          store.clear()
          assert.equal(store.refresh_token, undefined)
        })
      })
    })
  })

  describe('#updatedAt', () => {
    describe('before renew', () => {
      it('undefined', () => {
        assert.equal(store.updatedAt, undefined)
      })
    })

    describe('after renew', () => {
      beforeEach(() => {
        store.renew(tokenInfos())
      })
      it('moment object', () => {
        assert.equal(typeof store.updatedAt, 'object')
      })
    })
  })
})
