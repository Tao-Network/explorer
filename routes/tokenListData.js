#!/usr/bin/env node
module.exports = function(req, res){
  var respData = "";
    try{
      page = req.body.page;
      if(page<0 || page==undefined)
        page = 0;
      resultData={"totalPage":0, "list":null, "page":page};
      var mongoose = require( 'mongoose' );
      var Contract = mongoose.model('Contract');
      var pageSize = 10;
      Contract.count({ERC:{$gt:0}}).exec(function(err,c){
        resultData.totalPage = Math.ceil(c/pageSize);
        if(page>=resultData.totalPage){
          resultData.page = 0;
          page=0;
        }
        contractFind = Contract.find({ERC:{$gt:0}}).skip(page*pageSize).limit(pageSize).lean(true);
        contractFind.exec(function (err, docs) {
          resultData.list=docs;
          respData = JSON.stringify(resultData);
          res.write(respData);
          res.end();
        });
      });
      
    } catch (e) {
      console.error(e);
    }
}; 