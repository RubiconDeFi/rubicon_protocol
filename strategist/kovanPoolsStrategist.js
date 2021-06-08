const Web3 = require('web3');
// var Contract = require('web3-eth-contract');
var fs = require('fs');
require("dotenv").config();

// ************ Rubicon Pools Kovan Setup ***************

// Initialize Web3
// Kovan
// let web3 = new Web3("https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY);

// OP Kovan
let web3 = new Web3("https://kovan.optimism.io");
// console.log("Web3 Version: ", web3.version);

// Load the RubiconMarket contract
var { abi } = require("../build/contracts/RubiconMarket.json");
var rubiconMarketKovanAddr = process.env.OP_KOVAN_MARKET;
var RubiconMarketContractKovan = new web3.eth.Contract(abi, rubiconMarketKovanAddr);

// Load in Pools contract addresses on Kovan
var { abi } = require("../build/contracts/BathHouse.json");
var bathHouseKovanAddr = process.env.OP_KOVAN_BATHHOUSE;
var bathHouseContractKovan = new web3.eth.Contract(abi, bathHouseKovanAddr);

// Load in bath token asset contract addresses on Kovan
var { abi } = require("../build/contracts/BathToken.json");
var bathWayneKovanAddr = process.env.OP_KOVAN_BATHWAYNE;
var bathWayneContractKovan = new web3.eth.Contract(abi, bathWayneKovanAddr);

// Load in bath token quote contract addresses on Kovan
var { abi } = require("../build/contracts/BathToken.json");
var bathUsdcKovanAddr = process.env.OP_KOVAN_BATHUSDC;
var bathUsdcContractKovan = new web3.eth.Contract(abi, bathUsdcKovanAddr);

var { abi } = require("../build/contracts/PairsTrade.json");
var strategyKovanAddr = process.env.OP_KOVAN_PAIRSTRADE;
var strategyContractKovan = new web3.eth.Contract(abi, strategyKovanAddr);

// Load in WAYNE Contract
var { abi } = require("../build/contracts/EquityToken.json");
var WAYNEKovanAddr = process.env.OP_KOVAN_WAYNE;
var WAYNEContractKovan = new web3.eth.Contract(abi, WAYNEKovanAddr);

// Load in Dai Contract
var { abi } = require("../build/contracts/DaiWithFaucet.json");
var DAIKovanAddr = process.env.OP_KOVAN_USDC;
var DAIContractKovan = new web3.eth.Contract(abi, DAIKovanAddr);

var bathAssetToken = process.env.OP_KOVAN_BATHWAYNE;
var bathQuoteToken = process.env.OP_KOVAN_BATHUSDC;

// Load in BathPair Contract
var { abi } = require("../build/contracts/BathPair.json");
var bathPairKovanAddr = process.env.OP_KOVAN_BATHWAYNEUSDC;
var bathPairContractKovan = new web3.eth.Contract(abi, bathPairKovanAddr);

var sender = process.env.OP_KOVAN_ADMIN;
var key = process.env.OP_KOVAN_ADMIN_KEY;

function sendTx(tx, msg) {
    web3.eth.accounts.signTransaction(tx, key).then((signedTx) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', console.log).then((r) => {
            console.log("success", msg);
            console.log(r);
        }).catch((c) =>  {
            console.log("failure", c);
        });
    });
}

// // **Approve bathPair to recieve WAYNE and DAI first**
// var txData = WAYNEContractKovan.methods.approve(process.env.OP_KOVAN_BATHWAYNE, web3.utils.toWei("200")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: WAYNEKovanAddr,
//     gasPrice: web3.utils.toWei("0", "Gwei")
// }
// // Send the transaction
// sendTx(tx, "Approve bathPair to recieve WAYNE and DAI first");

// var txData = DAIContractKovan.methods.approve(process.env.OP_KOVAN_BATHUSDC, web3.utils.toWei("300")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: DAIKovanAddr,
//     gasPrice: web3.utils.toWei("0", "Gwei")
// }
// // Send the transaction
// sendTx(tx, "dai approve");

// // Deposit WAYNE into BathToken WAYNE
// var txData = bathWayneContractKovan.methods.deposit(web3.utils.toWei("200")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: process.env.OP_KOVAN_BATHWAYNE,
//     gasPrice: web3.utils.toWei("0", "Gwei")
// }
// // Send the transaction
// sendTx(tx, "Deposit WAYNE into BathToken WAYNE");

// 384078440000000000000
// console.log(bathUsdcContractKovan.methods.symbol().call().then((r) => console.log(r)));
// console.log(DAIContractKovan.methods.allowance(sender,process.env.OP_KOVAN_BATHUSDC ).call().then((r) => console.log(r)));

// // Deposit USDC into BathToken USDC
// var txData = bathUsdcContractKovan.methods.deposit(web3.utils.toWei("300")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: process.env.OP_KOVAN_BATHUSDC,
//     gasPrice: "0"
// }
// // Send the transaction
// sendTx(tx, "Deposit USDC into BathToken USDC");

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
// sendTx(tx);

// Validate parameters
// Strategy is Approved
// console.log(bathHouseContractKovan.methods.isApprovedStrat(process.env.OP_KOVAN_PAIRSTRADE).call().then((r) => console.log(r)));

// Bath pair ask and bid 
console.log(bathPairContractKovan.methods.underlyingAsset().call().then((r) => console.log(r)));
console.log(bathPairContractKovan.methods.initialized().call().then((r) => console.log(r)));
console.log(bathPairContractKovan.methods.getMaxOrderSize(process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_BATHWAYNE).call().then((r) => console.log(r)));


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
    const maxOrderSize =  5;//size in *quote currency* of the orders
    const shapeFactor = -0.005 // factor for dynamic ordersizing according to Fushimi, et al
    // *************************
    var newAskPrice = a * (1-spreadFactor);
    var newBidPrice = b * (1+spreadFactor);
    
    // Oversupply of bathQuote -> dynamic ask size
    if (im > 1) {
        var dynNum = (maxOrderSize * Math.pow((Math.E),((shapeFactor)* await (im)))) / newAskPrice;
        var dynDen = (maxOrderSize * Math.pow((Math.E),((shapeFactor)* await (im))));
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
        var dynNum = (maxOrderSize * Math.pow((Math.E),((shapeFactor)* await (im))));
        var dynDen = (maxOrderSize * Math.pow((Math.E),((shapeFactor)* await (im)))) / newBidPrice;
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
        gas: 9000000,
        data: txData.toString(),
        from: process.env.OP_KOVAN_ADMIN.toString(),
        to: bathPairKovanAddr,
        gasPrice: web3.utils.toWei("0", "Gwei")
    }
    // Send the transaction
    // sendTx(tx, "strategist market making trade")
}

// This function should return a positive or negative number reflecting the balance.
async function manageInventory(currentAsk, currentBid) {
    var assetBalance = await WAYNEContractKovan.methods.balanceOf(bathAssetToken).call();
    var quoteBalance = await DAIContractKovan.methods.balanceOf(bathQuoteToken).call();

    if (assetBalance == 0 || quoteBalance == 0) {
        console.log('Current asset liquidity balance: ', assetBalance);
        console.log('Current quote liquidity balance: ', quoteBalance);

        throw ("ERROR: no liquidity in quote or asset bathToken");
    }
    console.log("Asset liquidity in bathToken: ", assetBalance);
    console.log("Quote liquidity in bathToken: ", quoteBalance);
    console.log('current price / midpoint', (currentAsk + currentBid) / 2)

    // Ratio targets the current orderbook midpoint as the ideal ratio (50/50)
    return (quoteBalance / assetBalance) / ((currentAsk + currentBid) / 2); // This number represents if the pair is overweight in one direction    
}

// stoikov().then(async function(data) {
//     // console.log(data);
//     var currentAsk = data[0];
//     var currentBid = data[1];
//     console.log('current Ask price: ', currentAsk);
//     console.log('current Bid price: ', currentBid);

//     const IMfactor = manageInventory(currentAsk, currentBid);
//     console.log('IM factor', await IMfactor);
//     marketMake(currentAsk, currentBid, IMfactor);
// });

// This function sets off the chain of calls to successfully marketMake
// stoikov();







