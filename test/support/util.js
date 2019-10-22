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
module.exports.oauthClientOpts = oauthClientOpts

/** @return {string} */
function localDummyClientSpec () { // eslint-disable-line
  return path.join(__dirname, 'api.local.json')
}
module.exports.localDummyClientSpec = localDummyClientSpec

/** @return {string} */
function productionClientSpec () { // eslint-disable-line
  return path.join(__dirname, 'api.json')
}
module.exports.productionClientSpec = productionClientSpec
