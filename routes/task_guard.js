const dotenv = require("dotenv")
dotenv.config()
var express = require('express');
var router = express.Router();
const {ApiPromise, WsProvider, Keyring} = require('@polkadot/api') ;
const {getPolkadotApp} = require('../polkadot_tools')

const REQUEST_STATUS_IS_SUBMITTED = 1;
const REQUEST_STATUS_IS_VALID = 2;
const REQUEST_STATUS_IS_INVALID = 3;
const REQUEST_STATUS_IS_FINAL = 4;
const REQUEST_STATUS_IS_SENDING = 5;

const TASK_STATUS_IS_ACTIVE = 1;
const TASK_STATUS_IS_INACTIVE = 2;

function getMysqlConn() {
    var mysql      = require('mysql2');
    var connection = mysql.createConnection({
        host     : process.env.ATO_TASK_MYSQL_DB_HOST,
        port     : process.env.ATO_TASK_MYSQL_DB_PORT,
        user     : process.env.ATO_TASK_MYSQL_DB_USERNAME,
        password : process.env.ATO_TASK_MYSQL_DB_PASSWORD,
        database : process.env.ATO_TASK_MYSQL_DB_DATABASE
    });
    // connection.connect();
    return connection
}

router.get('/send_rewards_by_id',async function (req, res, next) {
    // Get
    try{
        let request_id = req.query.request_id;
        console.log(request_id)
        let dataResult = await getTaskRequest(REQUEST_STATUS_IS_VALID, request_id);
        // check and send rewards
        let txStatusArr = []
        for(var idx in dataResult) {
            let sendTx = await sendReward(dataResult[idx]) ;
            txStatusArr.push(sendTx)
        }
        res.json({result: 'success', data: {
                dataCount: dataResult.length,
                txStatus: txStatusArr,
            }});
    }catch (e){
        res.json({result: 'failed', data: e.toString()});
    }
});

router.get('/send_rewards_all',async function (req, res, next) {
    // Get
    try{
        let dataResult = await getTaskRequest(REQUEST_STATUS_IS_VALID);
        // check and send rewards
        let txStatusArr = []
        for(var idx in dataResult) {
            let sendTx = await sendReward(dataResult[idx]) ;
            txStatusArr.push(sendTx)
        }
        res.json({result: 'success', data: {
            dataCount: dataResult.length,
            txStatus: txStatusArr,
        }});
    }catch (e){
        res.json({result: 'failed', data: e.toString()});
    }
});

function getTaskRequest(request_status, request_id=0) {
    return new Promise((resolve, reject)=>{
        var conn = getMysqlConn();
        conn.connect();
        var sqlStr = `SELECT * FROM atocha_app.task_request WHERE request_status=${request_status}`;
        if(parseInt(request_id) > 0) {

            sqlStr = `SELECT * FROM atocha_app.task_request WHERE request_status=${request_status} AND id=${parseInt(request_id)}`;
        }
        console.log(`request_id = ${request_id}, getTaskRequest = `, sqlStr);
        conn.query(sqlStr, function (error, results, fields) {
            if (error) {
                reject(error)
                conn.end();
            }else{
                conn.end();
                resolve(results)
            }
        });
    })
}

function getTaskReward(task_id) {
    return new Promise((resolve, reject)=>{
        var conn = getMysqlConn();
        conn.connect();
        const sqlStr = `SELECT * FROM atocha_app.task_reward WHERE id=${task_id}`
        console.log(sqlStr)
        conn.query(sqlStr, function (error, results, fields) {
            if (error) {
                reject(error)
                conn.end();
            }else{
                conn.end();
                resolve(results)
            }
        });
    })
}

function updateTaskRequestStatus(request_id, status, txHash='') {
    return new Promise((resolve, reject)=>{
        var conn = getMysqlConn();
        conn.connect();
        // Update data to pending
        let sqlStr = `UPDATE atocha_app.task_request SET request_status = ${status} WHERE (id = ${request_id})`;
        if(txHash != '') {
            sqlStr = `UPDATE atocha_app.task_request SET request_status = ${status}, request_expand = '${txHash}' WHERE (id = ${request_id})`;
        }
        console.log(sqlStr)
        conn.query(sqlStr, function (error, results, fields) {
            if (error) {
                reject(error)
                conn.end();
            }else{
                conn.end();
                resolve(results)
            }
        });
    })
}


function sendReward(dbData) {
    return new Promise(async (resolve, reject) => {
        // check
        if (dbData.request_status != REQUEST_STATUS_IS_VALID) {
            reject(`REQUEST_STATUS ERROR MUST BE ${REQUEST_STATUS_IS_VALID}`)
        } else {
            // Check task information
            let taskRewardArr = await getTaskReward(dbData.task_id);
            let taskReward=taskRewardArr[0]
            if(!taskReward) {
                reject('No task entity found.')
            }else if(taskReward.task_status != TASK_STATUS_IS_ACTIVE) {
                reject('The task is no longer valid.')
            } else if (parseInt(taskReward.task_prize) <=0 || parseInt(taskReward.task_prize) > 1000000){
                reject('The reward amount should be between 1 Ato and 1 mAto.')
            } else{
                updateTaskRequestStatus(dbData.id, REQUEST_STATUS_IS_SENDING)
                const keyring = new Keyring({ type: 'sr25519' });
                // call polkadot and send reward.
                let api = await getPolkadotApp();
                // Create taskRewardAcc
                const taskRewardAcc = keyring.addFromUri(process.env.ATO_TASK_POLKADOT_MNEMONIC);
                const transferBalance = makeAtoBalance(taskReward.task_prize)
                const _nonce = await api.rpc.system.accountNextIndex(taskRewardAcc.address)
                let nonce = _nonce.toNumber()
                console.log('transferBalance = ', transferBalance, 'Nonce = ', nonce)
                // Make a transfer
                const unsub = await api.tx.balances
                  .transfer(dbData.request_owner, transferBalance)
                  .signAndSend(taskRewardAcc, { nonce: nonce },(result) => {
                      console.log(`Current status is ${result.status}`);
                      if (result.status.isInBlock) {
                          console.log(`Transaction included at blockHash ${result.status.asInBlock}`);
                      } else if (result.status.isFinalized) {
                          console.log(`Transaction finalized at blockHash ${result.status.asFinalized}`);
                          unsub();
                          // Update db to REQUEST_STATUS_IS_FINAL
                          updateTaskRequestStatus(dbData.id, REQUEST_STATUS_IS_FINAL, result.status.asFinalized)
                          resolve(result)
                      }
                  });
            }
        }
    })
}

function makeAtoBalance(atoBalance) {
    return BigInt(atoBalance) * BigInt(10**18)
}

module.exports = router;
