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

async function sendTx(tx, msg) {
    web3.eth.accounts.signTransaction(tx, key).then((signedTx) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', () => {}).then((r) => {
            console.log("*transaction success* => ", msg);
            // console.log(r);
        }).catch((c) =>  {
            throw (c);
        });
    });
}


// // **Approve bathPair to recieve WAYNE and DAI first**
// var txData = WAYNEContractKovan.methods.approve(process.env.OP_KOVAN_BATHWAYNE, web3.utils.toWei("200000")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: WAYNEKovanAddr,
//     gasPrice: web3.utils.toWei("0", "Gwei")
// }
// // Send the transaction
// sendTx(tx, "Approve bathPair to recieve WAYNE and DAI first");

// setTimeout(() => {console.log('waiting for nonce update')}, 2000)

// var txData = DAIContractKovan.methods.approve(process.env.OP_KOVAN_BATHUSDC, web3.utils.toWei("300000")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: DAIKovanAddr,
//     gasPrice: web3.utils.toWei("0", "Gwei")
// }
// // Send the transaction
// sendTx(tx, "dai approve");
// ---------------------------------------------------------
// // Deposit WAYNE into BathToken WAYNE
// var txData = bathWayneContractKovan.methods.deposit(web3.utils.toWei("100")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: process.env.OP_KOVAN_BATHWAYNE,
//     gasPrice: web3.utils.toWei("0", "Gwei")
// }
// // Send the transaction
// sendTx(tx, "Deposit WAYNE into BathToken WAYNE");

// // 384078440000000000000
// // console.log(bathUsdcContractKovan.methods.symbol().call().then((r) => console.log(r)));
// // console.log(DAIContractKovan.methods.allowance(sender,process.env.OP_KOVAN_BATHUSDC ).call().then((r) => console.log(r)));

// // // Deposit USDC into BathToken USDC
// var txData = bathUsdcContractKovan.methods.deposit(web3.utils.toWei("100")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: process.env.OP_KOVAN_BATHUSDC,
//     gasPrice: "0"
// }
// // Send the transaction
// sendTx(tx, "Deposit USDC into BathToken USDC");
// // ---------------------------------------------------------
// // Withdraw WAYNE from BathToken WAYNE
// var txData = bathWayneContractKovan.methods.withdraw(web3.utils.toWei("200")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: process.env.OP_KOVAN_BATHWAYNE,
//     gasPrice: web3.utils.toWei("0", "Gwei")
// }
// // Send the transaction
// sendTx(tx, "Withdraw WAYNE from BathToken WAYNE");

// 384078440000000000000
// console.log(bathUsdcContractKovan.methods.symbol().call().then((r) => console.log(r)));
// console.log(DAIContractKovan.methods.allowance(sender,process.env.OP_KOVAN_BATHUSDC ).call().then((r) => console.log(r)));

// // Withdraw USDC from BathToken USDC
// var txData = bathUsdcContractKovan.methods.withdraw(web3.utils.toWei("300")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: process.env.OP_KOVAN_BATHUSDC,
//     gasPrice: "0"
// }
// // Send the transaction
// sendTx(tx, "Withdraw USDC from BathToken USDC");
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

// // ------------------- Validate Migrations ------------------
//  BATH HOUSE
// Strategy is Approved
console.log(bathHouseContractKovan.methods.isApprovedStrat(process.env.OP_KOVAN_PAIRSTRADE).call().then((r) => {
    if (r == true) {console.log("BH isApprovedStrat CORRECT")} else {console.log("BH isApprovedStrat ** ERROR **")}
}));
console.log(bathHouseContractKovan.methods.isApprovedPair(process.env.OP_KOVAN_BATHWAYNEUSDC).call().then((r) => {
if (r == true) {console.log("BH isApprovedPair CORRECT")} else {console.log("BH isApprovedPair ** ERROR **")}
}));

console.log(bathHouseContractKovan.methods.getMarket().call().then((r) => {
    if (r == process.env.OP_KOVAN_MARKET) {console.log("BH getMarket CORRECT")} else {console.log("getMarket ** ERROR **")}
}));
console.log(bathHouseContractKovan.methods.getBathPair(process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_USDC).call().then((r) => {
    // console.log(r);
    if (r == process.env.OP_KOVAN_BATHWAYNEUSDC) {console.log("BH getBathPair CORRECT")} else {console.log("BH getBathPair ** ERROR **")}
}));

// BATH PAIR
// Bath pair ask and bid 
console.log(bathPairContractKovan.methods.underlyingAsset().call().then((r) => {
    if (r == process.env.OP_KOVAN_WAYNE) {console.log("BP underlyingAsset CORRECT")} else {console.log("underlyingAsset ** ERROR **")}
}));
console.log(bathPairContractKovan.methods.initialized().call().then((r) =>{
    if (r == true) {console.log("BP initialized CORRECT")} else {console.log("BP initialized ** ERROR **")}
    }));
console.log(bathPairContractKovan.methods.bathHouse().call().then((r) =>{
    if (r == process.env.OP_KOVAN_BATHHOUSE) {console.log("BP bathHouse CORRECT")} else {console.log("BP bathHouse ** ERROR **")}
}));
console.log(bathPairContractKovan.methods.bathAssetAddress().call().then((r) =>{
    if (r == process.env.OP_KOVAN_BATHWAYNE) {console.log("BP bathWAYNE CORRECT")} else {console.log("BP bathWAYNE ** ERROR **")}
}));
console.log(bathPairContractKovan.methods.bathQuoteAddress().call().then((r) =>{
    if (r == process.env.OP_KOVAN_BATHUSDC) {console.log("BP bathUSDC CORRECT")} else {console.log("BP bathUSDC ** ERROR **")}
}));

// These are reverting...
console.log(bathPairContractKovan.methods.getMaxOrderSize(process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_BATHWAYNE).call().then((r) => console.log("Max order size for WAYNE: " + r)));
console.log(bathPairContractKovan.methods.getMaxOrderSize(process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_BATHUSDC).call().then((r) => console.log("Max order size for USDC: " + r)));


//  BATH TOKENS
console.log(bathUsdcContractKovan.methods.symbol().call().then((r) =>{
    if (r == "bathUSDC") {console.log("BTUSDC symbol CORRECT")} else {console.log("BTUSDC symbol ** ERROR **")}
}));
console.log(bathUsdcContractKovan.methods.bathHouse().call().then((r) =>{
    if (r == process.env.OP_KOVAN_BATHHOUSE) {console.log("BTUSDC bathHouse CORRECT")} else {console.log("BTUSDC bathHouse ** ERROR **")}
}));
console.log(bathUsdcContractKovan.methods.RubiconMarketAddress().call().then((r) =>{
    if (r == process.env.OP_KOVAN_MARKET) {console.log("BTUSDC market CORRECT")} else {console.log("BTUSDC market ** ERROR **")}
}));
console.log(bathUsdcContractKovan.methods.underlyingToken().call().then((r) =>{
    if (r == process.env.OP_KOVAN_USDC) {console.log("BTUSDC underlyingToken CORRECT")} else {console.log("BTUSDC underlyingToken ** ERROR **")}
}));

console.log(bathWayneContractKovan.methods.symbol().call().then((r) =>{
    if (r == "bathWAYNE") {console.log("BTWAYNE symbol CORRECT")} else {console.log("BTWAYNE symbol ** ERROR **")}
}));
console.log(bathWayneContractKovan.methods.bathHouse().call().then((r) =>{
    if (r == process.env.OP_KOVAN_BATHHOUSE) {console.log("BTWAYNE bathHouse CORRECT")} else {console.log("BTWAYNE bathHouse ** ERROR **")}
}));
console.log(bathWayneContractKovan.methods.RubiconMarketAddress().call().then((r) =>{
    if (r == process.env.OP_KOVAN_MARKET) {console.log("BTWAYNE market CORRECT")} else {console.log("BTWAYNE market ** ERROR **")}
}));
console.log(bathWayneContractKovan.methods.underlyingToken().call().then((r) =>{
    if (r == process.env.OP_KOVAN_WAYNE) {console.log("BTWAYNE underlyingToken CORRECT")} else {console.log("BTWAYNE underlyingToken ** ERROR **")}
}));
// ------------------------------------

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

async function logInfo(mA, mB, a, b, im) {
    console.log('---------- Market Information ----------');
    console.log('Current Best Ask Price: ', mA);
    console.log('Current Best Bid Price: ', mB);
    console.log('Current Midpoint Price: ', (mA + mB) / 2);
    console.log('\n---------- Pools Information ----------');
    console.log('New Pools Ask Price: ', a);
    console.log('New Pools Bid Price: ', b);
    console.log('Pools Inventory Ratio [(Quote / Asset) ~ 1]: ', im);

    // APR CALCULATIONS
 (await bathWayneContractKovan.methods.totalSupply().call().then(async function(r) {
    // console.log("Total Supply of bathWAYNE: ", r);
    var underlying = await WAYNEContractKovan.methods.balanceOf(process.env.OP_KOVAN_BATHWAYNE).call();
    // console.log("Total Underlying: ", underlying);
    var uOverC = (await (underlying / r));
    let naiveAPR;
    if (uOverC >= 1) {
        naiveAPR = "+" +(((await (underlying / r)) - 1)*100).toFixed(3).toString() + "%";
    } else {
        naiveAPR = "-" + ((1- (await (underlying / r))) *100).toFixed(3).toString() + "%";
    }
    console.log("Return on Assets for bathWAYNE since Inception: ", naiveAPR);
    }));

     (await bathUsdcContractKovan.methods.totalSupply().call().then(async function(r) {
    // console.log("Total Supply of bathWAYNE: ", r);
    var underlying = await DAIContractKovan.methods.balanceOf(process.env.OP_KOVAN_BATHUSDC).call();
    // console.log("Total Underlying: ", underlying);
    var uOverC = (await (underlying / r));
    let naiveAPR;
    if (uOverC >= 1) {
        naiveAPR = "+" +(((await (underlying / r)) - 1)*100).toFixed(3).toString() + "%";
    } else {
        naiveAPR = "-" + ((1- (await (underlying / r))) *100).toFixed(3).toString() + "%";
    }
    console.log("Return on Assets for bathUSDC since Inception: ", naiveAPR);
    }));
    console.log('--------------------------------------\n')
}

let oldMidpoint;
async function checkForScrub(){
    // const outstandingPairCount = await bathPairContractKovan.outstandingPairIDs().call().then((r) => {console.log(r)});
    // console.log("AMOUNT OF OUT PAIRS", await outstandingPairCount);
    // counter = counter + 1;
    // if (counter % 3){
        var tx = {
            gas: 9000000,
            data: await bathPairContractKovan.methods.bathScrub().encodeABI(),
            from: process.env.OP_KOVAN_ADMIN.toString(),
            to: process.env.OP_KOVAN_BATHWAYNEUSDC,
            gasPrice: web3.utils.toWei("0", "Gwei")
        };
        await bathPairContractKovan.methods.bathScrub().estimateGas(tx, (async function(r, d) {
            if (d > 0) { 
            await sendTx(tx, "\n<* I have successfully scrubbed the bath, Master *>\n");
            } else{
                throw("gas estimation in bathScrub failed");
            }
        }));
    
}

async function marketMake(a, b, im) {
    // ***Market Maker Inputs***
    const targetSpread = 0.04; // the % of the spread we want to improve
    const maxOrderSize =  1;//size in *quote currency* of the orders
    const shapeFactor = -0.005 // factor for dynamic ordersizing according to Fushimi, et al
    // *************************
    var midPoint = (a + b) / 2;
    if (midPoint == oldMidpoint) {
        console.log('\n<* Midpoint is Unchanged, Therefore I Continue My Watch*>\n');
        return;
    } else {
        oldMidpoint = await midPoint;
    }
    var newAskPrice = midPoint * (1-targetSpread);
    var newBidPrice = midPoint * (1+targetSpread);
    // console.log('Expected new Ask Price ', newAskPrice);
    // console.log('Expected new Bid Price ', newBidPrice);
    
    // Oversupply of bathQuote -> dynamic ask size
    if (im > 1) {
        var dynNum = (maxOrderSize * Math.pow((Math.E),((shapeFactor)* await (im)))) / newAskPrice;
        var dynDen = (maxOrderSize * Math.pow((Math.E),((shapeFactor)* await (im))));
        var askNum = dynNum;
        var askDen = dynDen;
        // console.log('Dynamically sized ask:');
        // console.log(askNum);
        // console.log(askDen);
    
        var bidNum = maxOrderSize;
        var bidDen = maxOrderSize / newBidPrice;
        // console.log('New bid at max size:');
        // console.log(bidNum);
        // console.log(bidDen);
    } else {
    // Oversupply of bathAsset -> dynamic bid size
        var dynNum = (maxOrderSize * Math.pow((Math.E),((shapeFactor)* await (im))));
        var dynDen = (maxOrderSize * Math.pow((Math.E),((shapeFactor)* await (im)))) / newBidPrice;
        var bidNum = dynNum;
        var bidDen = dynDen;

        var askNum = maxOrderSize / newAskPrice;
        var askDen = maxOrderSize;
        // console.log('New Ask at max size:');
        // console.log(askNum);
        // console.log(askDen);
        // console.log('Dynamically sized bid:');
        // console.log(dynNum);
        // console.log(dynDen);
    }

    await logInfo(a, b, askDen / askNum, bidNum / bidDen, await im);

    // console.log('new ask price', askDen / askNum);
    // console.log('new bid price', bidNum / bidDen);
    // console.log("askNum: ", web3.utils.toWei(askNum.toFixed(18).toString()));
    // console.log("askDen: ", web3.utils.toWei(askDen.toString()));
    // console.log("bidDen: ", web3.utils.toWei(bidDen.toString()));
    // console.log("bidNum: ", web3.utils.toWei(bidNum.toFixed(18).toString()));
    // execute strategy with tighter spread
    var txData = bathPairContractKovan.methods.executeStrategy(
        strategyKovanAddr, 
        web3.utils.toWei(askNum.toFixed(18).toString()),
        web3.utils.toWei(askDen.toFixed(18).toString()),
        web3.utils.toWei(bidNum.toFixed(18).toString()),
        web3.utils.toWei(bidDen.toFixed(18).toString())
    ).encodeABI();
    var tx = {
        gas: 9000000,
        data: txData.toString(),
        from: process.env.OP_KOVAN_ADMIN.toString(),
        to: process.env.OP_KOVAN_BATHWAYNEUSDC,
        gasPrice: web3.utils.toWei("0", "Gwei")
    }
    
    // web3.eth.estimateGas(tx).then(console.log);
    // // Estimate the gas
    bathPairContractKovan.methods.executeStrategy(
        strategyKovanAddr, 
        web3.utils.toWei(askNum.toFixed(18).toString()),
        web3.utils.toWei(askDen.toFixed(18).toString()),
        web3.utils.toWei(bidNum.toFixed(18).toString()),
        web3.utils.toWei(bidDen.toFixed(18).toString())).estimateGas(tx,
            async function(e, d) {
            if (await d != null || d >= 0) {
                // Send the transaction
                // console.log(d);
                await sendTx(tx, 'New trades placed at ' + newBidPrice.toFixed(3).toString() + '$ and ' + newAskPrice.toFixed(3).toString()+'$' + '\n');
                // console.log('Pools Successful ~GAS ESTIMATE~ Execution of Strategist Bot\'s Trade - Yay Strategist Bot!');
            } else {
                console.log("**ERROR Executing Strategy**: \n");
                console.log(e);
            }
        });
}

// This function should return a positive or negative number reflecting the balance.
async function manageInventory(currentAsk, currentBid) {
    var currentReserveRatio = (80.00 / 100.00);
    var assetBalance = await WAYNEContractKovan.methods.balanceOf(bathAssetToken).call();
    var quoteBalance = await DAIContractKovan.methods.balanceOf(bathQuoteToken).call();
    const bathQuoteSupply = await bathUsdcContractKovan.methods.totalSupply().call();

    const bathAssetSupply = await bathWayneContractKovan.methods.totalSupply().call();
    // console.log(bathQuoteSupply);
    // console.log('Current asset liquidity balance: ', assetBalance);
    // console.log('Current quote liquidity balance: ', quoteBalance);
    // console.log('bathQuote deposited', bathQuoteSupply);
    // console.log('bathAsset deposited', bathQuoteSupply);

    if (assetBalance == 0 || quoteBalance == 0) {
        throw ("ERROR: no liquidity in quote or asset bathToken");
    }
    if ((bathAssetSupply * currentReserveRatio) >= (assetBalance)) {
        console.log('Hurdle Rate: ', (bathAssetSupply * currentReserveRatio));
        console.log('Asset balance: ', assetBalance);
        throw ("ERROR: insufficient asset liquidity to clear reserve ratio");
    }
    if ((bathQuoteSupply * currentReserveRatio) >= (quoteBalance)) {
        console.log('Hurdle Rate: ', (bathQuoteSupply * currentReserveRatio));
        console.log('Quote balance: ', assetBalance);
        throw ("ERROR: insufficient quote liquidity to clear reserve ratio");
    }

    // Ratio targets the current orderbook midpoint as the ideal ratio (50/50)
    return (quoteBalance / assetBalance) / ((currentAsk + currentBid) / 2); // This number represents if the pair is overweight in one direction    
}

// This function sets off the chain of calls to successfully marketMake
async function startBot() {
    setTimeout(async function() {
        await stoikov().then(async function(data) {
            var currentAsk = data[0];
            var currentBid = data[1];
    
            const IMfactor = manageInventory(currentAsk, currentBid);
            await checkForScrub();
            await marketMake(currentAsk, currentBid, IMfactor);
        });
        console.log('\n⚔⚔⚔ Strategist Bot Market Makes with Diligence and Valor ⚔⚔⚔\n');

      // Again
      startBot();

      // Every 5 sec
    }, 6000);
 
}

console.log('\n<* Strategist Bot Begins its Service to Rubicon *>\n');
console.log('\n<* Thank You Master Benjamin for Being a Great Master *>\n');
startBot();


