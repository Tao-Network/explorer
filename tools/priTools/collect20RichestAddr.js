require( '../../db.js' );
var mongoose = require('mongoose');
var Address = mongoose.model('Address');
// var web3 = require('./../../routes/web3relay').web3;
var Web3 = require('web3');
var rpc = "http://localhost:9646";
var web3 = new Web3(new Web3.providers.HttpProvider(rpc));

async function test(){
  let addresses = await Address.find({}).limit(20).sort({balance:-1}).exec();
  for (var i = 0; i < addresses.length; i++) {
    let balance = web3.eth.getBalance(addresses[i].addr);
    balance = web3.fromWei(balance, "ether");
    console.log(addresses[i].addr, balance);
  }
}

test()
