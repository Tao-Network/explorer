require( '../../db.js' );
var etherUnits = require("../../lib/etherUnits.js");
var BigNumber = require('bignumber.js');

var fs = require('fs');

var Web3 = require('web3');

var mongoose = require( 'mongoose' );
var Block     = mongoose.model( 'Block' );
var Transaction     = mongoose.model( 'Transaction' );
var grabBlocks3 = function(config) {
    var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:' + config.gethPort.toString()));

    // if('listenOnly' in config && config.listenOnly === true) {
    //     listenBlocks3(config, web3);
    // }
    // else
    //     setTimeout(function() {
    //         grabBlock3(config, web3, config.blocks.pop());
    //     }, 2000);

}

// var listenBlocks3 = function(config, web3) {
//     var newBlocks = web3.eth.filter("latest");
//     newBlocks.watch(function (error, log) {
//         //console.log("watch log:", log);

//         if(error) {
//             console.log('Error: ' + error);
//         } else if (log == null) {
//             console.log('Warning: null block hash');
//         } else {
//             grabBlock3(config, web3, log);
//         }

//     });
// }

var grabBlock3 = function(config, web3, blockHashOrNumber) {
    var desiredBlockHashOrNumber;

    // check if done
    if(blockHashOrNumber == undefined) {
        return; 
    }

    if (typeof blockHashOrNumber === 'object') {
        if('start' in blockHashOrNumber && 'end' in blockHashOrNumber) {
            desiredBlockHashOrNumber = blockHashOrNumber.end;
        }
        else {
            console.log('Error: Aborted becasue found a interval in blocks ' +
                'array that doesn\'t have both a start and end.');
            process.exit(9);
        }
    }
    else {
        desiredBlockHashOrNumber = blockHashOrNumber;
    }

    if(web3.isConnected()) {

        web3.eth.getBlock(desiredBlockHashOrNumber, true, function(error, blockData) {
            if(error) {
                console.log('Warning: error on getting block with hash/number: ' +
                    desiredBlockHashOrNumber + ': ' + error);
            }
            else if(blockData == null) {
                console.log('Warning: null block data received from the block with hash/number: ' +
                    desiredBlockHashOrNumber);
            }
            else {
                if('terminateAtExistingDB' in config && config.terminateAtExistingDB === true) {
                    checkBlockDBExistsThenWrite3(config, blockData);
                }
                else {
                    writeBlockToDB3(config, blockData);
                }
                if (!('skipTransactions' in config && config.skipTransactions === true))
                    writeTransactionsToDB3(config, blockData, web3.eth);
                // if('listenOnly' in config && config.listenOnly === true) 
                //     return;

                // if('hash' in blockData && 'number' in blockData) {
                //     // If currently working on an interval (typeof blockHashOrNumber === 'object') and 
                //     // the block number or block hash just grabbed isn't equal to the start yet: 
                //     // then grab the parent block number (<this block's number> - 1). Otherwise done 
                //     // with this interval object (or not currently working on an interval) 
                //     // -> so move onto the next thing in the blocks array.
                //     if(typeof blockHashOrNumber === 'object' &&
                //         (
                //             (typeof blockHashOrNumber['start'] === 'string' && blockData['hash'] !== blockHashOrNumber['start']) ||
                //             (typeof blockHashOrNumber['start'] === 'number' && blockData['number'] > blockHashOrNumber['start'])
                //         )
                //     ) {
                //         blockHashOrNumber['end'] = blockData['number'] - 1;
                //         grabBlock3(config, web3, blockHashOrNumber);
                //     }
                //     else {
                //         grabBlock3(config, web3, config.blocks.pop());
                //     }
                // }
                // else {
                //     console.log('Error: No hash or number was found for block: ' + blockHashOrNumber);
                //     process.exit(9);
                // }
            }
        });
    }
    else {
        console.log('Error: Aborted due to web3 is not connected when trying to ' +
            'get block ' + desiredBlockHashOrNumber);
        process.exit(9);
    }
}


var writeBlockToDB3 = function(config, blockData) {
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
            if(!('quiet' in config && config.quiet === true)) {
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
var checkBlockDBExistsThenWrite3 = function(config, blockData) {
    Block.find({number: blockData.number}, function (err, b) {
        if (!b.length)
            writeBlockToDB3(config, blockData);
        else {
            console.log('Aborting because block number: ' + blockData.number.toString() + 
                ' already exists in DB.');
            process.exit(9);
        }

    })
}

/**
    Break transactions out of blocks and write to DB
**/

var writeTransactionsToDB3 = function(config, blockData, eth) {
    var bulkOps = [];
    if (blockData.transactions.length > 0) {
        for (d in blockData.transactions) {
            var txData = blockData.transactions[d];
            if(txData.to == null){//contract create
                console.log("contract create at tx:"+txData.hash);
            }
            txData.timestamp = blockData.timestamp;
            txData.gasPrice = etherUnits.toEther(new BigNumber(txData.gasPrice), 'ether');
            txData.value = etherUnits.toEther(new BigNumber(txData.value), 'wei');
            //receipt
            var receiptData = eth.getTransactionReceipt(txData.hash);
            if(receiptData){
                txData.gasUsed = receiptData.gasUsed;
                txData.contractAddress = receiptData.contractAddress;
            }
            
            bulkOps.push(txData);

            //更新记录
            // Transaction.collection.save(txData);
            // Transaction.collection.updateOne({'hash':txData.hash}, { $set: { 'timestamp': txData.timestamp }});
        }

        //插入新记录
        Transaction.collection.insert(bulkOps, function( err, tx ){
            if ( typeof err !== 'undefined' && err ) {
                if (err.code == 11000) {
                    // console.log('Skip: Duplicate key ' + err);
                    console.log('Skip: Duplicate key ');
                } else {
                   console.log('Error: Aborted due to error: ' + 
                        err);
                   process.exit(9);
               }
            } else if(!('quiet' in config && config.quiet === true)) {
                console.log('DB written tx num: ' + blockData.transactions.length.toString() );
                
            }
        });

        
    }
}

/*
  Patch Missing Blocks
*/
var patchBlocks3 = function(config) {
    // var web3 = new Web3(new Web3.providers.HttpProvider('http://rpc.etherzero.org:' + config.gethPort.toString()));
    var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:' + config.gethPort.toString()));
    var lastBlock = web3.eth.blockNumber;
    console.log("topBlock:",lastBlock);

    blockIter3(web3, config);
}

var blockIter3 = function(web3, config) {
    if(currentBlock<config.patchEndBlocks){
        grabBlock3(config, web3, currentBlock);
        console.log("block number:", currentBlock)
        currentBlock++;
        setTimeout(blockIter3, 300, web3, config);
        // blockIter3(web3, config);
    }else{
        console.log("【finish path !】:", config.patchEndBlocks);
    }

}

// var blockIter3 = function(web3, firstBlock, lastBlock, config) {
//     // if consecutive, deal with it
//     if (lastBlock < firstBlock)
//         return;
//     if (lastBlock - firstBlock === 1) {
//         [lastBlock, firstBlock].forEach(function(blockNumber) {
//             Block.find({number: blockNumber}, function (err, b) {
//                 if (!b.length)
//                     grabBlock3(config, web3, firstBlock);
//             });
//         });
//     } else if (lastBlock === firstBlock) {
//         Block.find({number: firstBlock}, function (err, b) {
//             if (!b.length)
//                 grabBlock3(config, web3, firstBlock);
//         });
//     } else {
//         Block.count({number: {$gte: firstBlock, $lte: lastBlock}}, function(err, c) {
//           var expectedBlocks = lastBlock - firstBlock + 1;
//           if (c === 0) {
//             grabBlock3(config, web3, {'start': firstBlock, 'end': lastBlock});
//           } else if (expectedBlocks > c) {
//             console.log("Missing: " + JSON.stringify(expectedBlocks - c));  
//             var midBlock = firstBlock + parseInt((lastBlock - firstBlock)/2); 
//             blockIter3(web3, firstBlock, midBlock, config);
//             blockIter3(web3, midBlock + 1, lastBlock, config);
//           } else 
//             return;
//         })
//     }
// }


/** On Startup **/
// geth --rpc --rpcaddr "localhost" --rpcport "9646"  --rpcapi "eth,net,web3"

var config3 = {
    "gethPort": 9646,
    // "blocks": [ {"start": 0, "end": "latest"}],
    // "patchStartBlocks": 0,
    // "patchEndBlocks": 40,

    "blocks": [ {"start": 4936270, "end": "latest"}],
    "patchStartBlocks": 5401402,
    "patchEndBlocks": 5401403,
    
    "quiet": true,
    "terminateAtExistingDB": false,
    "listenOnly": true,
    "out": "."
};

var currentBlock = config3.patchStartBlocks;
// grabBlocks3(config);
patchBlocks3(config3);
