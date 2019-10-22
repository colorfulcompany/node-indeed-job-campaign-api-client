const express = require('express')
const app = express()

const port = 9292

app.get('*', (req, res) => {
  console.log(req.headers)
  res.send('')
})

console.log(`start server on http://localhost:${port}`)
app.listen(port)
