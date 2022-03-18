const dotenv = require("dotenv")
dotenv.config()
var express = require('express');
var router = express.Router();
// import Arweave from 'arweave';
// var Arweave = require('arweave');
const Arweave = require('arweave');
var TestWeave = require('testweave-sdk');
var request=require('request');
var sha256 =require('sha256');
const {ApiPromise, WsProvider} = require('@polkadot/api') ;

let arweave_test = Arweave.init({
    host: process.env.ATO_STORAGE_CONN_TEST_HOST,
    port: process.env.ATO_STORAGE_CONN_TEST_PORT,
    protocol: process.env.ATO_STORAGE_CONN_TEST_PROTOCOL,
    timeout: 20000,
    logging: false,
})

let arweave_real = Arweave.init({
    host: process.env.ATO_STORAGE_CONN_REAL_HOST,
    port: process.env.ATO_STORAGE_CONN_REAL_PORT,
    protocol: process.env.ATO_STORAGE_CONN_REAL_PROTOCOL,
    timeout: 20000,
    logging: false,
})

async function getPolkadotApp() {
    const wsProvider = new WsProvider(process.env.ATO_ATOCHA_TESTNET_WS);
    return await ApiPromise.create({provider: wsProvider});
}

async function getPreStorageOnChain(jsonHash, jsonLength){
    let polkadotApp = await getPolkadotApp();
    let storageOnchain = await polkadotApp.query.atochaFinace.storageLedger(jsonHash, jsonLength);
    const storageLength = storageOnchain?storageOnchain.toHuman()?storageOnchain.toHuman().jsonLength:0:0;
    return storageLength
}

/* GET arweave page. */
router.post('/localtest', async function (req, res, next) {
    let jsonStr = JSON.stringify(req.body);
    const jsonHash = sha256(jsonStr);
    const jsonLength = jsonStr.length;
    console.log('jsonHash', jsonHash);
    console.log('jsonLength', jsonLength);
    const storageLength = await getPreStorageOnChain(jsonHash, jsonLength);
    if (storageLength <= 0){
        console.log(`Storage length error current length is : ${storageLength}`)
        return;
    }
    console.log('Check passed, pending to arweave.');
    try{
        TestWeave.default.init(arweave_test).then(async (testArweave) => {
            let result = await arweave_test.createTransaction({
                // data: Buffer.from('Some data', 'utf8')
                data: jsonStr
            }, testArweave.rootJWK);
            await arweave_test.transactions.sign(result, testArweave.rootJWK);
            await arweave_test.transactions.post(result);
            await testArweave.mine();
            const statusAfterMine = await arweave_test.transactions.getStatus(result.id);
            console.log("Mine block status: ", statusAfterMine.status, "Block hash:", statusAfterMine.confirmed);
            if (statusAfterMine.status == 200) {
                console.log('Puzzle hash: ', result.id);
            }
            res.json({puzzle_hash: result.id});
        })
    }catch (e){
        console.log(`On error:`, e);
    }
});


/* GET arweave page. */
router.all('/', async function (req, res, next) {
    let output = 'done';
    let jsonStr = JSON.stringify(req.body);
    const jsonHash = sha256(jsonStr);
    const jsonLength = jsonStr.length;
    console.log('jsonHash', jsonHash);
    console.log('jsonLength', jsonLength);
    console.log(console.log(process.env.ATO_STORAGE_APP_VERSION));
    const storageLength = await getPreStorageOnChain(jsonHash, jsonLength);
    if (storageLength <= 0){
        console.log(`Storage length error current length is : ${storageLength}`)
        return;
    }
    console.log('Check passed, pending to arweave.');
    try{
        let key = JSON.parse(process.env.ATO_STORAGE_AR_KEY_FOR_TEST) ;
        arweave_real.wallets.jwkToAddress(key).then((address) => {
            console.log('Ar-Address:', address);
            arweave_real.wallets.getBalance(address).then((balance) => {
                let winston = balance;
                let ar = arweave_real.ar.winstonToAr(balance);
                console.log(`Ar: ${ar}, winstom: ${winston}`);
            });
        });

        let result = await arweave_real.createTransaction({
            // data: Buffer.from('Some data', 'utf8')
            data: jsonStr
        }, key);

        await arweave_real.transactions.sign(result, key);
        const response = await arweave_real.transactions.post(result);
        console.log(response.status);
        if (response.status == 200) {
            console.log('Puzzle hash: ', result.id);
        }
        output = JSON.stringify({result: 'ok', status: response.status, result_id: result.id, is_cache: false});
    }catch (e){
        output = JSON.stringify({result: 'failed', infos: e.toString()});
        console.log(`On error:`, e);
    }
    res.send(output);
});


module.exports = router;
