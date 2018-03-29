#!/usr/bin/env node
module.exports = function(req, res){
  var respData = "";
    try{
      console.log("respone tokenlist");
      var mongoose = require( 'mongoose' );
      var Contract = mongoose.model('Contract');
      contractFind = Contract.find({ERC:{$gt:0}}).lean(true);
      contractFind.exec(function (err, docs) {
      respData = JSON.stringify(docs);
      res.write(respData);
      res.end();
      });
    } catch (e) {
      console.error(e);
    }
}; 