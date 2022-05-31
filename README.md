# ato-storage
Backend project for connecting to Atocha project resource storage.

## Install 

## Setup

* Install the executable. The executable's major version will match Express's:

* `npx express-generator`
* `yarn install`
* 'yarn start'

## Install arweave sdk
* `yarn add arweave testweave-sdk`

## Install dotenv
* yarn add dotenv

## Install sqlite3
yarn add sqlite3

## Config ts support
* `sudo npm install -g typescript`
* `sudo npm install -g ts-node`
* yarn add @types/node
* yarn add @types/express 

## Make .env

```angular2html
ATO_STORAGE_APP_VERSION='v1.0.0'

ATO_STORAGE_AR_KEY_FOR_TEST=''
ATO_STORAGE_AR_KEY_FOR_REAL=''

ATO_STORAGE_CONN_TEST_HOST='127.0.0.1'
ATO_STORAGE_CONN_TEST_PORT='1984'
ATO_STORAGE_CONN_TEST_PROTOCOL='http'

ATO_STORAGE_CONN_REAL_HOST='arweave.net'
ATO_STORAGE_CONN_REAL_PORT='443'
ATO_STORAGE_CONN_REAL_PROTOCOL='https'

ATO_ATOCHA_CHAIN_WS='ws://X.X.X.X:XXXX'
```

