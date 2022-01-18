var express = require('express');
var router = express.Router();
// import Arweave from 'arweave';
// var Arweave = require('arweave');
const Arweave = require('arweave');
var TestWeave = require('testweave-sdk');
var request=require('request');

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
    // Check json hash at atocha chain.
    // Send arweave request.

    res.json({user:'tobi'});
});


module.exports = router;
