const path = require('path')

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

module.exports = {
  oauthClientOpts,
  localDummyClientSpec,
  productionClientSpec,
  mockResponseRefreshTokenSuccessfully
}
