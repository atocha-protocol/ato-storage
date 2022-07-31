const {ApiPromise} = require("@polkadot/api");
const {WsProvider} = require("@polkadot/api");

async function getPolkadotApp() {
  const wsProvider = new WsProvider(process.env.ATO_ATOCHA_CHAIN_WS);
  return await ApiPromise.create({provider: wsProvider});
}

module.exports = {getPolkadotApp} ;