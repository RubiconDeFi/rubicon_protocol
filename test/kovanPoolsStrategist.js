const Web3 = require('web3');
// var Contract = require('web3-eth-contract');
var fs = require('fs');
require("dotenv").config();

// Initialize Web3
let web3 = new Web3("https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY);
// console.log("Web3 Version: ", web3.version);

// Load the RubiconMarket contract
var { abi } = require("../build/contracts/RubiconMarket.json");
var rubiconMarketKovanAddr = "0x8A4A4d9A874dc038c01638e003fF7307498103f6";
var RubiconMarketContractKovan = new web3.eth.Contract(abi, rubiconMarketKovanAddr);

// Load in Pools contract addresses on Kovan
var { abi } = require("../build/contracts/BathHouse.json");
var bathHouseKovanAddr = "0xe86791480d3246e29976164763970b374eE2f4B7";
var bathHouseContractKovan = new web3.eth.Contract(abi, bathHouseKovanAddr);

var { abi } = require("../build/contracts/Strategy.json");
var strategyKovanAddr = "0xFC827B5157cAE59Ed96A2E0537B7C2EF9939306B";
var strategyContractKovan = new web3.eth.Contract(abi, strategyKovanAddr);

// Initialize a bathPair for WAYNE / DAI
var txData = bathHouseContractKovan.methods.initBathPair("0xC61812684385910CF8E93Fa0B04c572E6051F679", "WAYNE", "0x7f21271358765A4b04dB20Ba0BBFE309EC91259a", "DAI").encodeABI();

var tx = {
    gas: 12500000,
    data: txData.toString(),
    from: process.env.KOVAN_DEPLOYER_ADDRESS.toString(),
    to: bathHouseKovanAddr
}
web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY_KOVAN).then((signedTx) => {
    // console.log(signedTx);
    web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', console.log);
});


// Pseudocode - As a loop:
// 1. Grab the current price for a Kovan pair
// 2. executeStrategy --> Place better a bid and ask at the best bid/ask - 1
// 3. Rinse repeat...

