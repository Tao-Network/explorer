require( '../../db.js' );
var mongoose = require('mongoose');
var Witness = mongoose.model('Witness');
var Block = mongoose.model('Block');

async function test(){
  let witnesses = await Witness.aggregate([{$lookup:{from:"blocks",localField:"lastCountTo",foreignField:"number",as: "block"}}]).lean(true).exec()
  for (var i = 0; i < witnesses.length; i++) {
    let extraData = witnesses[i].block[0].extraData;
    let version = extraData.slice(6,8)+"."+extraData.slice(8,10)+"."+extraData.slice(10,12);
    console.log(witnesses[i].witness, version);
    // await Witness.update({"witness":witnesses[i].witness},
    //   {$set:{"version": version}}
    // ).exec()
  }
}
