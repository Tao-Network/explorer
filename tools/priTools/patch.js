/**
 * collect transactions, Token Contracts info from blockchain . write to db
 */
require( '../../db.js' );
var etherUnits = require("../../lib/etherUnits.js");
var BigNumber = require('bignumber.js');
var fs = require('fs');
var Web3 = require('web3');
var web3;
var mongoose = require( 'mongoose' );
var Block     = mongoose.model( 'Block' );
var Transaction     = mongoose.model( 'Transaction' );
var Contract     = mongoose.model( 'Contract' );
var InternalTx = mongoose.model( 'TokenTransfer' );
const ERC20_EVENT_DIC = {"0xa9059cbb":"Transfer", "0x23b872dd":"TransferFrom", "0x095ea7b3":"Approve","0xf2fde38b":"TransferOwnership"};

//modify according to your actual situation.
var config3 = {
    "httpProvider":"http://localhost:9646",
    "patchStartBlocks": 4936270,//1
    "patchEndBlocks": "latest",//5485123,//600
    "quiet": true,
    "terminateAtExistingDB": false
};




var grabBlock3 = function() {
    var desiredBlockHashOrNumber = currentBlock;
    
    if(web3.isConnected()) {

        web3.eth.getBlock(desiredBlockHashOrNumber, true, function(error, blockData) {
            if(error) {
                console.log('Warning: error on getting block with hash/number: ' + desiredBlockHashOrNumber + ': ' + error);
                tryNextBlock();
            }
            else if(blockData == null) {
                console.log('Warning: null block data received from the block with hash/number: ' + desiredBlockHashOrNumber);
                tryNextBlock();
            }
            else {
                if('terminateAtExistingDB' in config3 && config3.terminateAtExistingDB === true) {
                    checkBlockDBExistsThenWrite3(blockData);
                }
                else {
                    writeBlockToDB3(blockData);
                }
                if (!('skipTransactions' in config3 && config3.skipTransactions === true))
                    writeTransactionsToDB3(blockData, web3.eth);
                else{
                    tryNextBlock();
                }
            }
        });
    }
    else {
        console.log('Error: Aborted due to web3 is not connected when trying to ' +
            'get block ' + desiredBlockHashOrNumber);
        process.exit(9);
    }
}


var writeBlockToDB3 = function(blockData) {
    return new Block(blockData).save( function( err, block, count ){
        if ( typeof err !== 'undefined' && err ) {
            if (err.code == 11000) {
                console.log('Skip: Duplicate key ');
            } else {
               console.log('Error: Aborted due to error on ' + 
                    'block number ' + blockData.number.toString() + ': ' + 
                    err);
               process.exit(9);
           }
        } else {
            if(!('quiet' in config3 && config3.quiet === true)) {
                console.log('DB written for block number:' + blockData.number.toString() );
            }           
        }
      });
}

/**
  * Checks if the a record exists for the block number then ->
  *     if record exists: abort
  *     if record DNE: write a file for the block
  */
var checkBlockDBExistsThenWrite3 = function(blockData) {
    Block.findOne({number: blockData.number}, function (err, b) {
        if(err){
            console.log(err);
            return;
        }
        if (!b)
            writeBlockToDB3(blockData);
        else {
            console.log('Aborting because block number: ' + blockData.number.toString() + ' already exists in DB.');
        }

    })
}

/**
    Break transactions out of blocks and write to DB
**/

var writeTransactionsToDB3 = function(blockData, eth) {
    var bulkOps = [];
    if (blockData.transactions && blockData.transactions.length > 0) {
        for (d in blockData.transactions) {
            var txData = blockData.transactions[d];
            txData.timestamp = blockData.timestamp;
            txData.gasPrice = etherUnits.toEther(new BigNumber(txData.gasPrice), 'ether');
            txData.value = etherUnits.toEther(new BigNumber(txData.value), 'wei');
            //receipt
            var receiptData = eth.getTransactionReceipt(txData.hash);
            if(receiptData){
                txData.gasUsed = receiptData.gasUsed;
                txData.contractAddress = receiptData.contractAddress;
                if(receiptData.status!=null)
                    txData.status = receiptData.status;
            }
            if(txData.input && txData.input.length>2){//internal transaction , contract create
                if(txData.to == null){//contract create
                    console.log("contract create at tx:"+txData.hash);
                    var contractdb = {}
                    var isTokenContract = true;
                    var Token = ContractStruct.at(receiptData.contractAddress);
                    if(Token){//write Token to Contract in db
                        try{
                            contractdb.byteCode = eth.getCode(receiptData.contractAddress);
                            contractdb.tokenName = Token.name();
                            contractdb.decimals = Token.decimals();
                            contractdb.symbol = Token.symbol();
                            contractdb.totalSupply = Token.totalSupply();
                        }catch(err){
                            isTokenContract = false;
                        }
                    }else{//not Token Contract, need verify contract for detail
                        // console.log("not Token Contract");
                        isTokenContract = false;
                    }
                    contractdb.owner = txData.from;
                    contractdb.creationTransaction = txData.hash;
                    if(isTokenContract){
                        contractdb.ERC = 2;
                    }else{// normal contract
                        // console.log("normal contract");
                        contractdb.ERC = 0;
                    }
                    //write to db
                    Contract.update(
                        {address: receiptData.contractAddress}, 
                        {$setOnInsert: contractdb}, 
                        {upsert: true}, 
                        function (err, data) {
                            if(err)
                                console.log(err);
                        }
                    );
                }else{//internal transaction  . write to doc of InternalTx
                    var eventLog = {"transactionHash": "", "blockNumber": 0, "amount": 0, "contractAdd":"", "to": "", "from": "", "timestamp":0};
                    var methodCode = txData.input.substr(0,10);
                    if(methodCode=="0xa9059cbb"){//token transfer transaction
                        eventLog.methodName = "Transfer";
                        eventLog.to= "0x"+txData.input.substring(34,74);
                        eventLog.amount= Number("0x"+txData.input.substring(74));
                    }else{//other intternal transaction
                        if(ERC20_EVENT_DIC[methodCode])
                            eventLog.methodName = ERC20_EVENT_DIC[methodCode];
                        eventLog.to= txData.input;//raw data save at "to"
                    }
                    eventLog.transactionHash= txData.hash;
                    eventLog.blockNumber= blockData.number;
                    eventLog.contractAdd= txData.to;
                    eventLog.from= txData.from;
                    eventLog.timestamp = blockData.timestamp;

                    //write all type of internal transaction into db
                    InternalTx.update(
                        {transactionHash: eventLog.transactionHash}, 
                        {$setOnInsert: eventLog}, 
                        {upsert: true}, 
                        function (err, data) {
                            if(err)
                                console.log(err);
                        }
                    );

                    //write all type of internal transaction into db
                    // new InternalTx(eventLog).save( function( err, token, count ){
                    //     if ( typeof err !== 'undefined' && err ) {
                    //     if (err.code == 11000) {
                    //         console.log('Skip: Duplicate tx ' + txData.hash + ': ' + err);
                    //         return null;
                    //     } else {
                    //         console.log('Error: Aborted due to error on ' + 'block number ' + blockData.number.toString() + ': ' + err);
                    //         return null;
                    //     }
                    //     } else {
                    //         // console.log('DB successfully written for tx ' + txData.hash );  
                    //     }       
                    // });
                }
            }else{//out transaction
                // console.log("not contract transaction");
            }

            bulkOps.push(txData);
        }

        //insert doc
        Transaction.collection.insert(bulkOps, function( err, tx ){
            if ( typeof err !== 'undefined' && err ) {
                if (err.code == 11000) {
                    // console.log('Skip: Duplicate key ' + err);
                    console.log('Skip: Duplicate key ');
                } else {
                   console.log('Error: Aborted due to error: ' + err);
                   //process.exit(9);
               }
            } else if(!('quiet' in config3 && config3.quiet === true)) {
                console.log('DB written tx num: ' + blockData.transactions.length.toString() );
            }

            //patch next block recursively
            tryNextBlock();
        });

        
    }else{
         //patch next block recursively
         tryNextBlock();
    }
}

/*
  Patch Missing Blocks
*/
var patchBlocks3 = function() {
    // web3 = new Web3(new Web3.providers.HttpProvider('http://106.14.105.179:9646'));
    // web3 = new Web3(new Web3.providers.HttpProvider('http://rpc.etherzero.org:80'));
    // web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.etherzero.org:443'));
    web3 = new Web3(new Web3.providers.HttpProvider(config3.httpProvider));
    var lastBlock = web3.eth.blockNumber;
    if(config3.patchEndBlocks == "latest"){
        currentBlock = lastBlock+1;
    }else{
        currentBlock = config3.patchEndBlocks+1;
    }
    console.log("topBlock:",lastBlock);
    ContractStruct = web3.eth.contract(ERC20ABI);

    tryNextBlock();
}

var sleepFlag = 0;
var tryNextBlock = function() {
    currentBlock--
    sleepFlag++;
    console.log("block number:", currentBlock);
    if(currentBlock>=config3.patchStartBlocks){
        if(sleepFlag>3){
            sleepFlag = 0;
            setTimeout(grabBlock3, 100);
        }else{
            grabBlock3();
        }
        
    }else{
        console.log("【finish path !】:", config3.patchEndBlocks);
    }

}




const ERC20ABI = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}];
var ContractStruct;
var currentBlock;

patchBlocks3();
