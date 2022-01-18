var express = require('express');
var router = express.Router();
// import Arweave from 'arweave';
// var Arweave = require('arweave');
const Arweave = require('arweave');
var TestWeave = require('testweave-sdk');

var request=require('request');


/* GET home page. */
router.get('/', function (req, res, next) {

  let arweave = Arweave.init({
    host: '127.0.0.1',
    port: 1984,
    protocol: 'http',
    timeout: 20000,
    logging: false,
  })

  TestWeave.default.init(arweave).then(async (testArweave) => {
    console.log("RUN testArweave..")
    arweave.wallets.jwkToAddress(testArweave.rootJWK).then((addr) => {
      console.log('jwk to address:', addr)
      arweave.wallets.getBalance(addr).then((bal) => {
        console.log('bal = ', bal)
        const balance = arweave.ar.winstonToAr(bal)
        console.log('get balance: ', balance)
      })
    })
  })
  res.render('index', {title: 'Express'});
});

module.exports = router;
