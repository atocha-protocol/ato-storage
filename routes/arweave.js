var express = require('express');
var router = express.Router();
// import Arweave from 'arweave';
// var Arweave = require('arweave');
const Arweave = require('arweave');
var TestWeave = require('testweave-sdk');
var request=require('request');
var sha256 =require('sha256');

let arweave = Arweave.init({
    host: '127.0.0.1',
    port: 1984,
    protocol: 'http',
    timeout: 20000,
    logging: false,
})

/* GET arweave page. */
router.post('/', function (req, res, next) {
    let jsonStr = JSON.stringify(req.body) ;
    const jsonHash = sha256(jsonStr);
    const jsonLength = jsonStr.length;
    console.log('jsonHash', jsonHash);
    console.log('jsonLength', jsonLength);
    // Check json hash at atocha chain.
    // Send arweave request.

    TestWeave.default.init(arweave).then(async (testArweave) => {
        let result = await arweave.createTransaction({
            // data: Buffer.from('Some data', 'utf8')
            data: jsonStr
        }, testArweave.rootJWK);
        await arweave.transactions.sign(result, testArweave.rootJWK);
        console.log(result);
        await arweave.transactions.post(result);
        await testArweave.mine();
        const statusAfterMine = await arweave.transactions.getStatus(result.id);
        console.log("Mine block status: ", statusAfterMine.status, "Block hash:", statusAfterMine.confirmed);
        if (statusAfterMine.status == 200) {
            console.log('Puzzle hash: ', result.id);
        }
        res.json({puzzle_hash: result.id});
    })
});


module.exports = router;
