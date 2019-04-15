require( '../../db.js' );
var mongoose = require('mongoose');
var Address = mongoose.model('Address');
// var web3 = require('./../../routes/web3relay').web3;
var Web3 = require('web3');
var rpc = "http://localhost:9646";
var web3 = new Web3(new Web3.providers.HttpProvider(rpc));

async function test(){
  let addresses = await Address.find({}).limit(1000).sort({balance:-1}).exec();
  let result = new Array(21);
  result.fill(0);
  for (let i = 0; i < addresses.length; i++) {
    let balance = web3.eth.getBalance(addresses[i].addr);
    balance = web3.fromWei(balance, "ether");
    let balancenum = Number(balance)
    result[20] = {addr:addresses[i].addr,balance:balancenum};
    for (let i = result.length - 1; i > 0; i--) {
      if (result[i].balance > result[i-1].balance) {
        let temp = result[i];
        result[i] = result[i-1];
        result[i-1] = temp
      }
    }
    console.log(addresses[i].addr, balancenum);
  }
  console.log(result);
}

test()
