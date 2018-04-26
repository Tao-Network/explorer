#!/usr/bin/env node
module.exports = function(req, res){
  var respData = "";
  var mongoose = require( 'mongoose' );
  var TokenTransfer = mongoose.model( 'TokenTransfer' );
  if(req.body.address){
    try{
      tokenTransferFind = TokenTransfer.find({contractAdd:req.body.address}).lean(true);
      tokenTransferFind.exec(function (err, docs) {
      respData = JSON.stringify(docs);
      res.write(respData);
      res.end();
      });
    } catch (e) {
      console.error(e);
    }
  }else if(req.body.logs){
    try{
      txHash = req.body.logs.trim();
      tokenTransferFind = TokenTransfer.find({transactionHash:txHash}).lean(true);
      tokenTransferFind.exec(function (err, docs) {
      respData = JSON.stringify(docs);
      res.write(respData);
      res.end();
      });
    } catch (e) {
      console.error(e);
    }
  }
    
  
}; 