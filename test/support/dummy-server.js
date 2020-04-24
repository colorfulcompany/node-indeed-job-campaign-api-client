const sleep = require('sleep-promise')
const express = require('express')
const app = express()

const port = 9292

app.get('/api/v1/account', async (req, res) => {
  await sleep(10000)
})
app.get('*', (req, res) => {
  console.log(req.headers)
  res.send('')
})

class DummyServer {
  static run () {
    console.log(`start server on http://localhost:${port}`)

    return app.listen(port)
  }
}

module.exports = DummyServer
