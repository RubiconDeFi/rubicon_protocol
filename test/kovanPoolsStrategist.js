const Web3 = require('web3');
// var Contract = require('web3-eth-contract');
var fs = require('fs');
require("dotenv").config();

// Initialize Web3
let web3 = new Web3("https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY);
// console.log("Web3 Version: ", web3.version);

// Load the RubiconMarket contract
var { abi } = require("../build/contracts/RubiconMarket.json");
var rubiconMarketKovanAddr = process.env.RUBICONMARKET_V0_KOVAN;
var RubiconMarketContractKovan = new web3.eth.Contract(abi, rubiconMarketKovanAddr);

// Load in Pools contract addresses on Kovan
var { abi } = require("../build/contracts/BathHouse.json");
var bathHouseKovanAddr = "0xe86791480d3246e29976164763970b374eE2f4B7";
var bathHouseContractKovan = new web3.eth.Contract(abi, bathHouseKovanAddr);

var { abi } = require("../build/contracts/Strategy.json");
var strategyKovanAddr = "0xFC827B5157cAE59Ed96A2E0537B7C2EF9939306B";
var strategyContractKovan = new web3.eth.Contract(abi, strategyKovanAddr);

// // Initialize a bathPair for WAYNE / DAI
// var txData = bathHouseContractKovan.methods.initBathPair("0xC61812684385910CF8E93Fa0B04c572E6051F679", "WAYNE", "0x7f21271358765A4b04dB20Ba0BBFE309EC91259a", "DAI").encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: process.env.KOVAN_DEPLOYER_ADDRESS.toString(),
//     to: bathHouseKovanAddr,
//     gasPrice: web3.utils.toWei("50", "Gwei")
// }
// // Send the transaction
// web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY_KOVAN).then((signedTx) => {
//     web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', console.log);
// });

// Kovan 4.7.21
// New BathPair: 0x0D2632967ab6fe195c6B4659cBc414695456AA54
// New bathToken (WAYNE): 0x935947b550e75ecd1956a28549c892fe038880d0
// new BathToken (DAI): 0xc8b820db24f85dd9f42656d9a2d46a7b453c3a6c

// Load in BathPair Contract
var { abi } = require("../build/contracts/BathPair.json");
var bathPairKovanAddr = "0x0D2632967ab6fe195c6B4659cBc414695456AA54";
var bathPairContractKovan = new web3.eth.Contract(abi, bathPairKovanAddr);

// Load in WAYNE Contract
var { abi } = require("../build/contracts/EquityToken.json");
var WAYNEKovanAddr = "0xC61812684385910CF8E93Fa0B04c572E6051F679";
var WAYNEContractKovan = new web3.eth.Contract(abi, WAYNEKovanAddr);

// Load in Dai Contract
var { abi } = require("../build/contracts/EquityToken.json");
var DAIKovanAddr = "0x7f21271358765A4b04dB20Ba0BBFE309EC91259a";
var DAIContractKovan = new web3.eth.Contract(abi, DAIKovanAddr);

// **Approve bathPair to recieve WAYNE and DAI first**
// var txData = WAYNEContractKovan.methods.approve(bathPairKovanAddr, web3.utils.toWei("200")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: process.env.KOVAN_DEPLOYER_ADDRESS.toString(),
//     to: WAYNEKovanAddr,
//     gasPrice: web3.utils.toWei("20", "Gwei")
// }
// // Send the transaction
// web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY_KOVAN).then((signedTx) => {
//     web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', console.log);
// });

// var txData = DAIContractKovan.methods.approve(bathPairKovanAddr, web3.utils.toWei("400")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: process.env.KOVAN_DEPLOYER_ADDRESS.toString(),
//     to: DAIKovanAddr,
//     gasPrice: web3.utils.toWei("50", "Gwei")
// }
// // Send the transaction
// web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY_KOVAN).then((signedTx) => {
//     web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', console.log);
// });

// // Deposit assets into BathPair
// var txData = bathPairContractKovan.methods.deposit("0xC61812684385910CF8E93Fa0B04c572E6051F679", web3.utils.toWei("200"), "0x7f21271358765A4b04dB20Ba0BBFE309EC91259a", web3.utils.toWei("400")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: process.env.KOVAN_DEPLOYER_ADDRESS.toString(),
//     to: bathPairKovanAddr,
//     gasPrice: web3.utils.toWei("20", "Gwei")
// }
// // Send the transaction
// web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY_KOVAN).then((signedTx) => {
//     web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', console.log);
// });

// The above was used to successfully deposit assets into the bath WAYNE/DAI pair on Kovan

// MarketMake:
// Pseudocode - As a loop:
// 1. Grab the current price for a Kovan pair
// 2. executeStrategy --> Place better a bid and ask at the best bid/ask - 1
// 2a. Make sure that dynamic order sizes are placed to manage inventory...

async function getSpread() {
    // var bestAsk = await RubiconMarketContractKovan.methods.getOfferCount(WAYNEKovanAddr, DAIKovanAddr).call();
    var bestAsk = await RubiconMarketContractKovan.methods.getBestOffer(WAYNEKovanAddr, DAIKovanAddr).call();
    console.log(bestAsk);
    var askInfo = await RubiconMarketContractKovan.methods.getOffer(bestAsk).call();
    console.log(askInfo[2] / askInfo[0]);
}

getSpread()
// WAYNEContractKovan.methods.balanceOf(bathPairKovanAddr).call().then(console.log);

// console.log(bestAsk);





