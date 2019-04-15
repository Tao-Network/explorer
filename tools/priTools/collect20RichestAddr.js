require( '../../db.js' );
var mongoose = require('mongoose');
var Address = mongoose.model('Address');
var web3 = require('./web3relay').web3;

async function test(){
  let addresses = await Address.find({}).limit(20).sort({balance:-1}).exec();
  for (var i = 0; i < addresses.length; i++) {
    let balance = web3.eth.getBalance(addresses[i].addr);
    balance = web3.fromWei(balance, "ether");
    console.log(addresses[i].addr, balance);
  }
}

test()
