## Indeed Job Campaign API Client

for Node.js

https://opensource.indeedeng.io/api-documentation/docs/campaigns/ref/

## features

 * execute API using Operaion ID according to Swagger spec
 * store access_token and automatically refresh

## requirements

 * register app and fetch initial token
     * https://opensource.indeedeng.io/api-documentation/docs/campaigns/auth/
 * implement your own token store
     * extends OAuthTokenStoreBase

## example

```javascript
const path = require('path')

const {
  ApiClient,
  OAuthTokenClient,
  OAuthTokenStorePlainFile
} = require('indeed-job-campaign-api-client')

const store = new OAuthTokenStorePlainFile(path.join(__dirname, 'token-store.json'))
const oauth = new OAuthTokenClient(store)

;(async () => {
  const client = await ApiClient.create(oauth)

  console.log(await client.employer())
})()
```
