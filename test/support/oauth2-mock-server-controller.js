const { OAuth2Server } = require('oauth2-mock-server')

class OAuth2MockServerController {
  constructor (host = 'localhost', port = 9876) {
    this.host = host
    this.port = port
    this.server = undefined
  }

  async start () {
    this.server = new OAuth2Server()
    await this.server.issuer.keys.generateRSA()
    await this.server.start(this.port, this.host)
  }

  async stop () {
    await this.server.stop()
  }
}

module.exports = OAuth2MockServerController
