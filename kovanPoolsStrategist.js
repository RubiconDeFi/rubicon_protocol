const Web3 = require('web3');
// var Contract = require('web3-eth-contract');
var fs = require('fs');
require("dotenv").config();

// ************ Rubicon Pools Kovan Setup ***************

// Initialize Web3
let web3 = new Web3("https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY);
// console.log("Web3 Version: ", web3.version);

// Load the RubiconMarket contract
var { abi } = require("./build/contracts/RubiconMarket.json");
var rubiconMarketKovanAddr = process.env.RUBICONMARKET_V0_KOVAN;
var RubiconMarketContractKovan = new web3.eth.Contract(abi, rubiconMarketKovanAddr);

// Load in Pools contract addresses on Kovan
var { abi } = require("./build/contracts/BathHouse.json");
var bathHouseKovanAddr = "0x5ccF8360344646727E36c1E2877aaF151d46B2d9";
var bathHouseContractKovan = new web3.eth.Contract(abi, bathHouseKovanAddr);

var { abi } = require("./build/contracts/PairsTrade.json");
var strategyKovanAddr = "0xFd9146ea9F19df448E63e96B25dD880DDFa9Cc3C";
var strategyContractKovan = new web3.eth.Contract(abi, strategyKovanAddr);

// Load in WAYNE Contract
var { abi } = require("./build/contracts/EquityToken.json");
var WAYNEKovanAddr = "0xC61812684385910CF8E93Fa0B04c572E6051F679";
var WAYNEContractKovan = new web3.eth.Contract(abi, WAYNEKovanAddr);

// Load in Dai Contract
var { abi } = require("./build/contracts/EquityToken.json");
var DAIKovanAddr = "0x7f21271358765A4b04dB20Ba0BBFE309EC91259a";
var DAIContractKovan = new web3.eth.Contract(abi, DAIKovanAddr);

// // Initialize a bathPair for WAYNE / DAI
// var txData = bathHouseContractKovan.methods.initBathPair(WAYNEKovanAddr, "WAYNE", DAIKovanAddr, "DAI", 90).encodeABI();
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

// Kovan 4.8.21
// New BathPair: 0xe6de87cf75110c28a488091668aace99fa93703e
// New bathToken (WAYNE): 0x09fe4e229615c2b76d524481a03ec46981a9f62e
// new BathToken (DAI): 0xd154e2e5322f2501de9ce041d99b3c1fed77e59b

var bathAssetToken = "0x09fe4e229615c2b76d524481a03ec46981a9f62e"
var bathQuoteToken = "0xd154e2e5322f2501de9ce041d99b3c1fed77e59b"

// Load in BathPair Contract
var { abi } = require("./build/contracts/BathPair.json");
var bathPairKovanAddr = "0xe6de87cf75110c28a488091668aace99fa93703e";
var bathPairContractKovan = new web3.eth.Contract(abi, bathPairKovanAddr);

// **Approve bathPair to recieve WAYNE and DAI first**
// var txData = WAYNEContractKovan.methods.approve(bathPairKovanAddr, web3.utils.toWei("200")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: process.env.KOVAN_DEPLOYER_ADDRESS.toString(),
//     to: WAYNEKovanAddr,
//     gasPrice: web3.utils.toWei("30", "Gwei")
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
//     gasPrice: web3.utils.toWei("30", "Gwei")
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
//     gasPrice: web3.utils.toWei("40", "Gwei")
// }
// // Send the transaction
// web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY_KOVAN).then((signedTx) => {
//     web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', console.log);
// });

// // Withdraw assets from BathPair
// var txData = bathPairContractKovan.methods.withdraw("0xC61812684385910CF8E93Fa0B04c572E6051F679", web3.utils.toWei("200"), "0x7f21271358765A4b04dB20Ba0BBFE309EC91259a", web3.utils.toWei("400")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: process.env.KOVAN_DEPLOYER_ADDRESS.toString(),
//     to: bathPairKovanAddr,
//     gasPrice: web3.utils.toWei("50", "Gwei")
// }
// // Send the transaction
// web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY_KOVAN).then((signedTx) => {
//     web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', console.log);
// });

// // Approve the Strategy
// var txData = bathHouseContractKovan.methods.approveStrategy(strategyKovanAddr).encodeABI();
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

// ************ The above was used to successfully deposit assets into the bath WAYNE/DAI pair on Kovan *************

// MarketMake:
// Pseudocode - As a loop:
// 1. Grab the current price for a Kovan pair
// 2. executeStrategy --> Place better a bid and ask at the best bid/ask - 1
// 2a. Make sure that dynamic order sizes are placed to manage inventory...

async function stoikov() {
    var bestAsk = await RubiconMarketContractKovan.methods.getBestOffer(WAYNEKovanAddr, DAIKovanAddr).call();
    var askInfo = await RubiconMarketContractKovan.methods.getOffer(bestAsk).call();
    var bestAskPrice = (askInfo[2] / askInfo[0]);

    var bestBid = await RubiconMarketContractKovan.methods.getBestOffer(DAIKovanAddr, WAYNEKovanAddr).call();
    var bidInfo = await RubiconMarketContractKovan.methods.getOffer(bestBid).call();
    var bestBidPrice = (bidInfo[0] / bidInfo[2]);
    return [bestAskPrice, bestBidPrice];
}

async function marketMake(a, b, im) {
    console.log('Current best ask: ', a);
    console.log('Current best bid: ', b);
    console.log('IM Factor', await im); // ratio of current inventory balance divided by the target balance

    // ***Market Maker Inputs***
    const spreadFactor = 0.02; // the % of the spread we want to improve
    const maxOrderSize =  10;//size in *quote currency* of the orders
    const shapeFactor = -0.005 // factor for dynamic ordersizing according to Fushimi, et al
    // *************************
    var newAskPrice = a * (1-spreadFactor);
    var newBidPrice = b * (1+spreadFactor);
    
    // Oversupply of bathQuote -> dynamic ask size
    if (im > 1) {
        var dynNum = (maxOrderSize * Math.pow((Math.E),((-0.005)* await (im)))) / newAskPrice;
        var dynDen = (maxOrderSize * Math.pow((Math.E),((-0.005)* await (im))));
        var askNum = dynNum;
        var askDen = dynDen;
        console.log('Dynamically sized ask:');
        console.log(askNum);
        console.log(askDen);
    
        var bidNum = maxOrderSize;
        var bidDen = maxOrderSize / newBidPrice;
        console.log('New bid at max size:');
        console.log(bidNum);
        console.log(bidDen);
    } else {
    // Oversupply of bathAsset -> dynamic bid size
        var dynNum = (maxOrderSize * Math.pow((Math.E),((-0.005)* await (im))));
        var dynDen = (maxOrderSize * Math.pow((Math.E),((-0.005)* await (im)))) / newBidPrice;
        var bidNum = dynNum;
        var bidDen = dynDen;

        var askNum = maxOrderSize / newAskPrice;
        var askDen = maxOrderSize;
        console.log('New Ask at max size:');
        console.log(askNum);
        console.log(askDen);
        console.log('Dynamically sized bid:');
        console.log(dynNum);
        console.log(dynDen);
    }
 

    console.log('new ask price', askDen / askNum);
    console.log('new bid price', bidNum / bidDen);


    // execute strategy with tighter spread
    var txData = bathPairContractKovan.methods.executeStrategy(
        strategyKovanAddr, 
        web3.utils.toWei(askNum.toString()),
        web3.utils.toWei(askDen.toString()),
        web3.utils.toWei(bidNum.toString()),
        web3.utils.toWei(bidDen.toString())
    ).encodeABI();
    var tx = {
        gas: 12500000,
        data: txData.toString(),
        from: process.env.KOVAN_DEPLOYER_ADDRESS.toString(),
        to: bathPairKovanAddr,
        gasPrice: web3.utils.toWei("40", "Gwei")
    }
    // Send the transaction
    web3.eth.accounts.signTransaction(tx, process.env.PRIVATE_KEY_KOVAN).then((signedTx) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', console.log);
    });
}

// This function should return a positive or negative number reflecting the balance.
async function manageInventory(currentAsk, currentBid) {
    var assetBalance = await WAYNEContractKovan.methods.balanceOf(bathAssetToken).call();
    var quoteBalance = await DAIContractKovan.methods.balanceOf(bathQuoteToken).call();
    console.log(assetBalance);
    console.log(quoteBalance);
    console.log('current price / midpoint', (currentAsk + currentBid) / 2)
    console.log('quote over asset', (quoteBalance / assetBalance) / ((currentAsk + currentBid) / 2));

    // Ratio targets the current orderbook midpoint as the ideal ratio (50/50)
    return (quoteBalance / assetBalance) / ((currentAsk + currentBid) / 2); // This number represents if the pair is overweight in one direction    
}

stoikov().then((data) => {
    var currentAsk = data[0];
    var currentBid = data[1];

    const IMfactor = manageInventory(currentAsk, currentBid);
    marketMake(currentAsk, currentBid, IMfactor);
});

// This function sets off the chain of calls to successfully marketMake
stoikov();







