## Indeed Job Campaign API Client

for Node.js

https://opensource.indeedeng.io/api-documentation/docs/campaigns/ref/

## Features

 * execute API using Operaion ID according to Swagger spec
 * store access_token and automatically refresh

## Requirements

 * register app and fetch initial token
     * https://opensource.indeedeng.io/api-documentation/docs/campaigns/auth/
 * implement your own token store
     * extends OAuthTokenStoreBase

## Example

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

## Available Configuration Options

 * client_id ( token )
 * client_secret ( secret )
 * access_token ( initial )
 * refresh_token ( not stored )
 * redirect_uri ( Indeed API requires always )
 * expires_in
 * baseSite
 * authorizePath
 * accessTokenPath

## Available Enviromnent Variables

 * INDEED_CLIENT_ID
 * INDEED_CLIENT_SECRET
 * INDEED_ACCESS_TOKEN
 * INDEED_REFRESH_TOKEN
 * INDEED_REDIRECT_URI
