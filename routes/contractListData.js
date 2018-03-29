#!/usr/bin/env node
module.exports = function(req, res){
  var respData = "";
    try{
      //console.log("respone tokenlist. ERC:",req.body.ERC);
      var ERC_type = req.body.ERC;
      var mongoose = require( 'mongoose' );
      var Contract = mongoose.model('Contract');
      if(ERC_type==-1)
        contractFind = Contract.find({}).lean(true);
      else
        contractFind = Contract.find({ERC:ERC_type}).lean(true);
      contractFind.exec(function (err, docs) {
      respData = JSON.stringify(docs);
      res.write(respData);
      res.end();
      });
    } catch (e) {
      console.error(e);
    }
}; 