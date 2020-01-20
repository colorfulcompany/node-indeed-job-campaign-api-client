const path = require('path')
const OAuthTokenClient = require('oauth-token-client')

/**
 * @return {object}
 */
function oauthClientOpts () {
  const env = process.env

  if (Object.keys(env).filter(k => k.startsWith('INDEED_')).length >= 4) {
    return {
      access_token: env.INDEED_ACCESS_TOKEN,
      refresh_token: env.INDEED_REFRESH_TOKEN,
      client_id: env.INDEED_CLIENT_ID,
      secret: env.INDEED_CLIENT_SECRET
    }
  } else {
    return {}
  }
}

/** @return {string} */
function localDummyClientSpec () { // eslint-disable-line
  return path.join(__dirname, 'api.local.json')
}

/** @return {string} */
function productionClientSpec () { // eslint-disable-line
  return path.join(__dirname, 'api.json')
}

/**
 * @param {object} server
 * @return {void}
 */
function mockResponseRefreshTokenSuccessfully (server) {
  server.service.once('beforeResponse', (tokenEndpointResponse) => {
    // copied from Indeed Autentication document
    // https://opensource.indeedeng.io/api-documentation/docs/campaigns/auth/#refresh-token
    tokenEndpointResponse.body = {
      access_token: 'FNEDvUYcL8o',
      convid: '1c1a1s8540kkt89p',
      scope: ['all'],
      token_type: 'Bearer',
      expires_in: 3600
    }
  })
}

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
 * @param {object} store
 * @param {string} host
 * @param {number} port
 * @return {object}
 */
function createOAuthClient (store, host, port) {
  return new OAuthTokenClient(
    store,
    {
      ...paramForRefreshingToken(),
      baseSite: `http://${host}:${port}`,
      authorizePath: '/authorize',
      accessTokenPath: '/token'
    })
}

module.exports = {
  oauthClientOpts,
  localDummyClientSpec,
  productionClientSpec,
  mockResponseRefreshTokenSuccessfully,
  paramForRefreshingToken,
  createOAuthClient
}
