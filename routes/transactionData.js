#!/usr/bin/env node
// var etherUnits = require("../lib/etherUnits.js");
// var BigNumber = require('bignumber.js');

module.exports = function(req, res){
  var respData = "";
    try{
      //console.log("respone tokenlist");
      var mongoose = require( 'mongoose' );
      var Transaction = mongoose.model('Transaction');
      var isTransfer = req.body.isTransfer;
      TransactionFind = Transaction.findOne({hash:req.body.tx}).lean(true);
      TransactionFind.exec(function (err, doc) {
        if(err || !doc)//if no result in db , get from web3
        {
          require('./web3relay').data(req, res);
          return;
        }
        
        var isToken = false;
        var isContract = false;
        
        //is token and verified
        var contractAddr = doc.to;
        if(!doc.to){
          contractAddr = doc.contractAddress;
        }
        doc.contractAddr = contractAddr;
        var contractLable="";
        var contractName="";
        var contractLink = "";

        if(doc.input && doc.input.length>2){//contract token
          isContract = true;
          if(isTransfer && doc.input.length>=138){
            doc.to = "0x"+doc.input.substr(34,40);
            var tokenNum = doc.input.substr(74,64);
            var web3 = require('./web3relay');
            tokenNum = web3.web3.toDecimal("0x"+tokenNum);
            doc.tokenNum = tokenNum;
            doc.isTransfer=true;
          }
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
                  doc.ERC = "ERC20";
                }else if(result[0].ERC == 3){
                  doc.ERC = "ERC223";
                }else{
                  doc.ERC = "ERC";
                }
              } 
              contractName = result[0].contractName;  
              if(!doc.to){//contract token creation
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
              doc.needVerify = true;
            }
            doc.contractName = contractName;
            doc.contractLable = contractLable;
            doc.contractLink = contractLink;
            
            respData = JSON.stringify(doc);
            res.write(respData);
            res.end();
          });
        }else{//normal transaction
          doc.contractName = contractName;
          doc.contractLable = contractLable;
          doc.contractLink = contractLink;
          respData = JSON.stringify(doc);
          res.write(respData);
          res.end();
        }
      });
    } catch (e) {
      console.error(e);
    }
}; 