#!/usr/bin/env node
// var etherUnits = require("../lib/etherUnits.js");
// var BigNumber = require('bignumber.js');

module.exports = function(req, res){
  var respData = "";
    try{
      //console.log("respone tokenlist");
      var mongoose = require( 'mongoose' );
      var Transaction = mongoose.model('Transaction');
      TransactionFind = Transaction.find({hash:req.body.tx}).lean(true);
      TransactionFind.exec(function (err, docs) {
        if(err || !docs || docs.length==0)//if no result in db , get from web3
        {
          require('./web3relay').data(req, res);
          return;
        }
        
        var isToken = false;
        var isContract = false;
        
        //is token and verified
        var contractAddr = docs[0].to;
        if(!docs[0].to){
          contractAddr = docs[0].contractAddress;
        }
        docs[0].contractAddr = contractAddr;
        var contractLable="";
        var contractName="";
        var contractLink = "";

        if(docs[0].input && docs[0].input.length>2){//contract token
          isContract = true;
          var Contract = mongoose.model('Contract');
          ContractFind = Contract.find({address:contractAddr}).lean(true);
          ContractFind.exec(function (contractErr, result) {
            if(contractErr){
              console.log(contractErr);
            }else if(result.length>0){
              if(result[0].ERC == 0){//normal contract
                contractLink = "contract/"+contractAddr;
              }else{
                isToken = true;
                contractLink = "token/"+contractAddr;
                if(result[0].ERC == 2){
                  docs[0].ERC = "ERC20";
                }else if(result[0].ERC == 3){
                  docs[0].ERC = "ERC223";
                }else{
                  docs[0].ERC = "ERC";
                }
              } 
              contractName = result[0].contractName;  
              if(!docs[0].to){//contract token creation
                if(isToken)
                  contractLable = "token creation";
                else
                  contractLable = "contract creation"; 
              }else{
                if(isToken){//token transaction
                  contractLable = "token transaction";
                }else{//normal contract transaction
                  contractLable = "contract transaction";
                }
              }        
            }else{
              contractLable = "contract";//need verify
              contractName = contractAddr;
              contractLink = "addr/"+contractAddr;
              docs[0].needVerify = true;
            }
            docs[0].contractName = contractName;
            docs[0].contractLable = contractLable;
            docs[0].contractLink = contractLink;
            
            respData = JSON.stringify(docs[0]);
            res.write(respData);
            res.end();
          });
        }else{//normal transaction
          docs[0].contractName = contractName;
          docs[0].contractLable = contractLable;
          docs[0].contractLink = contractLink;
          respData = JSON.stringify(docs[0]);
          res.write(respData);
          res.end();
        }
      });
    } catch (e) {
      console.error(e);
    }
}; 