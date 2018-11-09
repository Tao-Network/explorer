# ETZExplorer 

<b>Live Version: [etherhub.io](http://etherhub.io)</b>

Follow the project progress at: [ETZ Block Explorer Development](https://trello.com/b/W3ftl57z/etc-block-explorer-development) 

## Local installation

Clone the repo

`git clone https://github.com/ethereumproject/explorer`

Download [Nodejs and npm](https://docs.npmjs.com/getting-started/installing-node "Nodejs install") if you don't have them

Install dependencies:

`npm install`

Install mongodb:

MacOS: `brew install mongodb`

Centos: `yum install -y mongodb`

Ubuntu: `sudo apt-get install -y mongodb-org`


## config rpc

open "routes/web3relay.js" and modify "HttpProvider" usually by "http://localhost:8545". 


## Populate the DB

This will fetch and parse the entire blockchain.

Configuration file: `/tools/grabber.js`
modify the var "config" (near the file end) like follow basic settings:
--------------
var config = {
    "rpc": 'http://localhost:8545',
    "blocks": [ {"start": 0, "end": "latest"}],
    "quiet": true,
    "terminateAtExistingDB": false,
    "listenOnly": true,
    "out": "."
};
-------------
```rpc``` etherzero rpc which your browser will grab data from

```blocks``` is a list of blocks to grab. It can be specified as a list of block numbers or an interval of block numbers. When specified as an interval, it will start at the ```end``` block and keep recording decreasing block numbers. 

```terminateAtExistingDB``` will terminate the block grabber once it gets to a block it has already stored in the DB.

```quiet``` prints out the log of what it is doing. currently not use

```listenOnly``` When true, the grabber will create a filter to receive the latest blocks from geth as they arrive. It will <b>not</b> continue to populate older block numbers. 

<b>Note: When ```listenOnly``` is set to ```true```, the ```blocks``` option is ignored. </b>

<b>Note 2: ```terminateAtExistingDB``` and ```listenOnly``` are mutually exclusive. Do not use ```terminateAtExistingDB``` when in ```listenOnly``` mode.</b>

### Run:

`node ./tools/grabber.js`

Leave this running in the background to continuously fetch new blocks.


