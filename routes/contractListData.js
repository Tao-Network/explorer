#!/usr/bin/env node
module.exports = function(req, res){
  var respData = "";
    try{
      page = req.body.page;
      if(page<0 || page==undefined)
        page = 0;
      var pageSize = 10;
      resultData={"totalPage":0, "list":null, "page":page};
      var ERC_type = req.body.ERC;
      var mongoose = require( 'mongoose' );
      var Contract = mongoose.model('Contract');
      var findCondition;
      if(ERC_type==-1)
        findCondition = {};
      else
        findCondition = {ERC:ERC_type};
      Contract.count(findCondition).exec(function(err,c){
          resultData.totalPage = Math.ceil(c/pageSize);
          if(page>=resultData.totalPage){
            resultData.page = 0;
            page=0;
          }
          contractFind = Contract.find(findCondition).skip(page*pageSize).limit(pageSize).lean(true);
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