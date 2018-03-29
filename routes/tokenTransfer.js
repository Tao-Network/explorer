#!/usr/bin/env node
module.exports = function(req, res){
  var respData = "";
    try{
      console.log("respone TokenTransfer");
      var mongoose = require( 'mongoose' );
      var TokenTransfer = mongoose.model( 'TokenTransfer' );
      tokenTransferFind = TokenTransfer.find({contractAdd:req.body.address}).lean(true);
      tokenTransferFind.exec(function (err, docs) {
      respData = JSON.stringify(docs);
      });
    } catch (e) {
      console.error(e);
    }
    res.write(respData);
    res.end();
}; 