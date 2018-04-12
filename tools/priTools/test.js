
var Web3 = require('web3');

var testRPC = function(config) {
    var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:' + config.gethPort.toString()));
    var number = web3.eth.getBlockTransactionCunt(0);
    // var number = web3.eth.getBlockByNumber(1);
}


var rpcConfig = {
    "gethPort": 9646,
    "blocks": [ {"start": 0, "end": "latest"}],
    "patchStartBlocks": 0,
    "patchEndBlocks": 40,

    // "blocks": [ {"start": 4936270, "end": "latest"}],
    // "patchStartBlocks": 5108946,
    // "patchEndBlocks": 5380381,
    
    "quiet": true,
    "terminateAtExistingDB": false,
    "listenOnly": true,
    "out": "."
};

var currentBlock = rpcConfig.patchStartBlocks;
testRPC(rpcConfig);
