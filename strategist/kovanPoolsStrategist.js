const Web3 = require('web3');
// var Contract = require('web3-eth-contract');
var fs = require('fs');
require("dotenv").config();
const BigNumber = require('bignumber.js');
BigNumber.config({ DECIMAL_PLACES: 18 });
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
// ************ Rubicon Pools Kovan Setup ***************

// Initialize Web3
// Kovan
// let web3 = new Web3("https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY);

// OP Kovan
let web3 = new Web3("https://kovan.optimism.io");
// console.log("Web3 Version: ", web3.version);

// Load the RubiconMarket contract
var { abi } = require("../build/contracts/RubiconMarket.json");
var rubiconMarketKovanAddr = process.env.OP_KOVAN_TC_MARKET;
var RubiconMarketContractKovan = new web3.eth.Contract(abi, rubiconMarketKovanAddr);

// Load in Pools contract addresses on Kovan
var { abi } = require("../build/contracts/BathHouse.json");
var bathHouseKovanAddr = process.env.OP_KOVAN_TC_BATHHOUSE;
var bathHouseContractKovan = new web3.eth.Contract(abi, bathHouseKovanAddr);

// Load in bath token asset contract addresses on Kovan
var { abi } = require("../build/contracts/BathToken.json");
var bathWayneKovanAddr = process.env.OP_KOVAN_TC_BATHWBTC;
var bathWayneContractKovan = new web3.eth.Contract(abi, bathWayneKovanAddr);

// Load in bath token quote contract addresses on Kovan
var { abi } = require("../build/contracts/BathToken.json");
var bathUsdcKovanAddr = process.env.OP_KOVAN_TC_BATHUSDC;
var bathUsdcContractKovan = new web3.eth.Contract(abi, bathUsdcKovanAddr);

var { abi } = require("../build/contracts/PairsTrade.json");
var strategyKovanAddr = process.env.OP_KOVAN_TC_PAIRSTRADE;
var strategyContractKovan = new web3.eth.Contract(abi, strategyKovanAddr);

// Load in WAYNE Contract
var { abi } = require("../build/contracts/EquityToken.json");
var WAYNEKovanAddr = process.env.OP_KOVAN_TC_WBTC;
var WAYNEContractKovan = new web3.eth.Contract(abi, WAYNEKovanAddr);

// Load in Dai Contract
var { abi } = require("../build/contracts/DaiWithFaucet.json");
var USDC_OP_KOVAN = process.env.OP_KOVAN_TC_USDC;
var DAIContractKovan = new web3.eth.Contract(abi, USDC_OP_KOVAN);

var bathAssetToken = process.env.OP_KOVAN_TC_BATHWBTC;
var bathQuoteToken = process.env.OP_KOVAN_TC_BATHUSDC;

// Load in BathPair Contract
var { abi } = require("../build/contracts/BathPair.json");
const { ethers } = require('ethers');
var bathPairKovanAddr = process.env.OP_KOVAN_TC_BATHWBTCUSDC;
var bathPairContractKovan = new web3.eth.Contract(abi, bathPairKovanAddr);

var sender = process.env.OP_KOVAN_ADMIN;
var key = process.env.OP_KOVAN_ADMIN_KEY;

// *** Nonce Manager ***
let baseNonce = web3.eth.getTransactionCount(process.env.OP_KOVAN_ADMIN);
let nonceOffset = 0;
function getNonce() {
  return baseNonce.then((nonce) => (nonce + (nonceOffset++)));
}

async function sendTx(tx, msg) {
    tx.nonce = await getNonce();
    tx.gasPrice = 15000000;
    tx.gasLimit = 13000000;
    tx.gas = 13000000;
    // console.log('outgoing transaction: ', tx);
    web3.eth.accounts.signTransaction(tx, key).then((signedTx) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('receipt', () => {}).then((r) => {
            console.log("*transaction success* => ", msg);
            // return;
            // console.log(r);
        }).catch((c) =>  {
            console.log('** Transaction Failed **', msg);
            throw (c);
        });
    });
}

//#region 


// // // ------------------- Validate Migrations ------------------
// //  BATH HOUSE
// // Strategy is Approved
// bathHouseContractKovan.methods.isApprovedStrat(process.env.OP_KOVAN_TC_PAIRSTRADE).call().then((r) => {
//     if (r == true) {console.log("BH isApprovedStrat CORRECT")} else {console.log("BH isApprovedStrat ** ERROR **")}
// });
// bathHouseContractKovan.methods.isApprovedPair(process.env.OP_KOVAN_TC_BATHWBTCUSDC).call().then((r) => {
// if (r == true) {console.log("BH isApprovedPair CORRECT")} else {console.log("BH isApprovedPair ** ERROR **")}
// });

// bathHouseContractKovan.methods.getMarket().call().then((r) => {
//     if (r == process.env.OP_KOVAN_TC_MARKET) {console.log("BH getMarket CORRECT")} else {console.log("getMarket ** ERROR **")}
// });
// console.log(bathHouseContractKovan.methods.getBathPair(process.env.OP_KOVAN_TC_WBTC, process.env.OP_KOVAN_TC_USDC).call().then((r) => {
//     // console.log(r);
//     if (r == process.env.OP_KOVAN_TC_BATHWBTCUSDC) {console.log("BH getBathPair CORRECT")} else {console.log("BH getBathPair ** ERROR **")}
// }));

// //  BATH TOKENS
// console.log(bathUsdcContractKovan.methods.symbol().call().then((r) =>{
//     if (r == "bathUSDC") {console.log("BTUSDC symbol CORRECT")} else {console.log("BTUSDC symbol ** ERROR **", r)}
// }));
// bathUsdcContractKovan.methods.initialized().call().then((r) =>{
//     if (r == true) {console.log("BTUSDC initialized CORRECT")} else {console.log("BTUSDC initi ** ERROR **", r)}
// });
// console.log(bathUsdcContractKovan.methods.bathHouse().call().then((r) =>{
//     if (r == process.env.OP_KOVAN_TC_BATHHOUSE) {console.log("BTUSDC bathHouse CORRECT")} else {console.log("BTUSDC bathHouse ** ERROR **", r)}
// }));
// console.log(bathUsdcContractKovan.methods.RubiconMarketAddress().call().then((r) =>{
//     if (r == process.env.OP_KOVAN_TC_MARKET) {console.log("BTUSDC market CORRECT")} else {console.log("BTUSDC market ** ERROR **"), r}
// }));
// console.log(bathUsdcContractKovan.methods.underlyingToken().call().then((r) =>{
//     if (r == process.env.OP_KOVAN_TC_USDC) {console.log("BTUSDC underlyingToken CORRECT")} else {console.log("BTUSDC underlyingToken ** ERROR **")}
// }));

// console.log(bathWayneContractKovan.methods.symbol().call().then((r) =>{
//     if (r == "bathWBTC") {console.log("BTWBTC symbol CORRECT")} else {console.log("BTWAYNE symbol ** ERROR **",r )}
// }));
// console.log(bathWayneContractKovan.methods.bathHouse().call().then((r) =>{
//     if (r == process.env.OP_KOVAN_TC_BATHHOUSE) {console.log("BTWAYNE bathHouse CORRECT")} else {console.log("BTWAYNE bathHouse ** ERROR **", r)}
// }));
// console.log(bathWayneContractKovan.methods.RubiconMarketAddress().call().then((r) =>{
//     if (r == process.env.OP_KOVAN_TC_MARKET) {console.log("BTWAYNE market CORRECT")} else {console.log("BTWAYNE market ** ERROR **", r)}
// }));
// console.log(bathWayneContractKovan.methods.underlyingToken().call().then((r) =>{
//     if (r == process.env.OP_KOVAN_TC_WBTC) {console.log("BTWAYNE underlyingToken CORRECT")} else {console.log("BTWAYNE underlyingToken ** ERROR **", r)}
// }));
// RubiconMarketContractKovan.methods.getMinSell(process.env.OP_KOVAN_TC_WBTC).call().then((r) => {
//     console.log("min sell wayne: ", r)
// });

// // BATH PAIR
// // Bath pair ask and bid 
// bathPairContractKovan.methods.underlyingAsset().call().then((r) => {
//     if (r == process.env.OP_KOVAN_TC_WBTC) {console.log("BP underlyingAsset CORRECT")} else {console.log("underlyingAsset ** ERROR **", r)}
// });
// bathPairContractKovan.methods.underlyingQuote().call().then((r) => {
//     if (r == process.env.OP_KOVAN_TC_USDC) {console.log("BP underlyingQuote CORRECT")} else {console.log("underlyingQuote ** ERROR **", r)}
// });
// console.log(bathPairContractKovan.methods.initialized().call().then((r) =>{
//     if (r == true) {console.log("BP initialized CORRECT")} else {console.log("BP initialized ** ERROR **")}
// }));
// console.log(bathPairContractKovan.methods.bathHouse().call().then((r) =>{
//     if (r == process.env.OP_KOVAN_TC_BATHHOUSE) {console.log("BP bathHouse CORRECT")} else {console.log("BP bathHouse ** ERROR **")}
// }));
// console.log(bathPairContractKovan.methods.bathAssetAddress().call().then((r) =>{
//     if (r == process.env.OP_KOVAN_TC_BATHWBTC) {console.log("BP bathWAYNE CORRECT")} else {console.log("BP bathWAYNE ** ERROR **")}
// }));
// console.log(bathPairContractKovan.methods.bathQuoteAddress().call().then((r) =>{
//     if (r == process.env.OP_KOVAN_TC_BATHUSDC) {console.log("BP bathUSDC CORRECT")} else {console.log("BP bathUSDC ** ERROR **")}
// }));


// // Will revert if no bathToken liquidity
// console.log(bathPairContractKovan.methods.getMaxOrderSize(process.env.OP_KOVAN_TC_WBTC, process.env.OP_KOVAN_TC_BATHWBTC).call().then((r) => console.log("POOLS Max order size for WBTC: " + web3.utils.fromWei(r))));
// console.log(bathPairContractKovan.methods.getMaxOrderSize(process.env.OP_KOVAN_TC_USDC, process.env.OP_KOVAN_TC_BATHUSDC).call().then((r) => console.log("POOLS Max order size for USDC: " + web3.utils.fromWei(r))));
// bathUsdcContractKovan.methods.totalSupply().call().then((r) =>{
//    console.log("Total supply of BathUSDC", web3.utils.fromWei(r))
// });
// bathPairContractKovan.methods.maxOrderSizeBPS().call().then((r) =>{
//     console.log("Max order sizeBPD of BathPair", (r))
//  });

//#endregion
// ------------------------------------

// MarketMake:
// Pseudocode - As a loop:
// 1. Grab the current price for a Kovan pair
// 2. executeStrategy --> Place better a bid and ask at the best bid/ask - 1
// 2a. Make sure that dynamic order sizes are placed to manage inventory...

async function getContractFromToken(ticker, contract) {
    // Load in Dai Contract
    var { abi } = require("../build/contracts/" + contract + ".json");
    if (contract == "BathToken") {
        var address = process.env['OP_KOVAN_TC_BATH' + ticker];
    } else if (contract == "BathPair") {
        var address = process.env['OP_KOVAN_TC_BATH' + ticker + 'USDC'];
    } else if (contract == "EquityToken") {
        var address = process.env['OP_KOVAN_TC_' + ticker];
    } else {
        throw("unhandled contract type");
    }
    return new web3.eth.Contract(abi, address);
}


async function stoikov(token) {
    var bestAsk = await RubiconMarketContractKovan.methods.getBestOffer(process.env['OP_KOVAN_TC_' + token], USDC_OP_KOVAN).call();
    var askInfo = await RubiconMarketContractKovan.methods.getOffer(bestAsk).call();
    var bestAskPrice = (askInfo[2] / askInfo[0]);

    var bestBid = await RubiconMarketContractKovan.methods.getBestOffer(USDC_OP_KOVAN, process.env['OP_KOVAN_TC_' + token]).call();
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
    var underlying = await WAYNEContractKovan.methods.balanceOf(process.env.OP_KOVAN_TC_BATHWBTC).call();
    // console.log("Total Underlying: ", underlying);
    var uOverC = (await (underlying / r));
    let naiveAPR;
    console.log("balanceOf underlying", underlying);
    console.log("totalSupply", r);

    if (uOverC >= 1) {
        naiveAPR = "+" +(((await (underlying / r)) - 1)*100).toFixed(3).toString() + "%";
    } else {
        naiveAPR = "-" + ((1- (await (underlying / r))) *100).toFixed(3).toString() + "%";
    }
    console.log("Return on Assets for bathWAYNE since Inception: ", naiveAPR);
    }));

     (await bathUsdcContractKovan.methods.totalSupply().call().then(async function(r) {
    // console.log("Total Supply of bathWAYNE: ", r);
    var underlying = await DAIContractKovan.methods.balanceOf(process.env.OP_KOVAN_TC_BATHUSDC).call();
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

async function checkForScrub(ticker){
        const contract = await getContractFromToken(ticker, "BathPair");
        await contract.methods.getOutstandingPairCount().call().then(async (r) => {
            if (r > 5) {
                // Scrub the bath
                var txData = await contract.methods.bathScrub().encodeABI();
                var tx = {
                    gas: 9530000,
                    data: txData,
                    from: process.env.OP_KOVAN_ADMIN.toString(),
                    to: process.env['OP_KOVAN_TC_BATH' + ticker + 'USDC'],
                    gasPrice: web3.utils.toWei("0.015", "Gwei")
                };
                await contract.methods.bathScrub().estimateGas(tx, (async function(r, d) {
                    if (d > 0) { 
                    await sendTx(tx, "\n<* I have successfully scrubbed the " + ticker + " bath, Master *>\n");
                    } else{
                        throw("gas estimation in bathScrub failed");
                    }
                }));
            } else {
                return;
            }
        });


}

let oldMidpoint = [];
let zeroMP = 0;
async function marketMake(a, b, ticker, im, spread) {
    const contract = await getContractFromToken(ticker, "BathPair");
    // ***Market Maker Inputs***
    const targetSpread = spread; // the % of the spread we want to improve
    const scaleBack =  new BigNumber(5); // used to scale back maxOrderSize   
    // *************************
    // Check if midpoint is unchanged before market making
    var midPoint = (a + b) / 2;
    if (midPoint == oldMidpoint[ticker]) {
        console.log('\n<* Midpoint is Unchanged, Therefore I Continue My Watch*>\n');
        return;
    } else if (midPoint == 0 ) {
        zeroMP++;
        console.log("got a zero midpoint, skipping market make, total times is: ", zeroMP);
        return;
    }
    else {
        oldMidpoint[ticker] = midPoint;
    }

    var newBidPrice = new BigNumber(parseFloat(midPoint * (1-targetSpread)));
    var newAskPrice = new BigNumber(parseFloat(midPoint * (1+targetSpread)));

    // getMaxOrderSize from contract for bid and ask
    const maxAskSize = new BigNumber(await contract.methods.getMaxOrderSize(process.env['OP_KOVAN_TC_' + ticker], process.env['OP_KOVAN_TC_BATH' + ticker]).call());
    const maxBidSize = new BigNumber(await contract.methods.getMaxOrderSize(process.env.OP_KOVAN_TC_USDC, process.env.OP_KOVAN_TC_BATHUSDC).call());
    
    // in wei
    const askNum = maxAskSize.dividedBy(scaleBack);
    const askDen = (askNum.multipliedBy(newAskPrice));

    const bidNum = maxBidSize.dividedBy( scaleBack);
    const bidDen = bidNum.dividedBy(newBidPrice);

    // await logInfo(a, b, askDen / askNum, bidNum / bidDen, await im);

    var txData = contract.methods.executeStrategy(
        process.env.OP_KOVAN_TC_PAIRSTRADE, 
        web3.utils.toBN(askNum.decimalPlaces(0)),
        web3.utils.toBN(askDen.decimalPlaces(0)),
        web3.utils.toBN(bidNum.decimalPlaces(0)),
        web3.utils.toBN(bidDen.decimalPlaces(0))
    ).encodeABI();
    var tx = {
        gas: 9000000,
        data: txData.toString(),
        from: process.env.OP_KOVAN_ADMIN.toString(),
        to: process.env['OP_KOVAN_TC_BATH' + ticker + 'USDC'],
        gasPrice: web3.utils.toWei("0", "Gwei")
    }
    // console.log('New ' + ticker + ' trades placed at [bid]: ' + newBidPrice.toString() + '$ and [ask]: ' + newAskPrice.toString()+'$' + '\n');
    await sendTx(tx, 'New ' + ticker + ' trades placed at [bid]: ' + newBidPrice.toString() + '$ and [ask]: ' + newAskPrice.toString()+'$' + '\n');
}

// This function should return a positive or negative number reflecting the balance.
async function checkInventory(currentAsk, currentBid, ticker) {
    const contractBP = await getContractFromToken(ticker, "BathToken");
    const contractT = await getContractFromToken(ticker, "EquityToken");

    var currentReserveRatio = (80.00 / 100.00);
    var assetBalance = await contractT.methods.balanceOf(process.env['OP_KOVAN_TC_BATH' + ticker]).call();
    var quoteBalance = await DAIContractKovan.methods.balanceOf(process.env.OP_KOVAN_TC_BATHUSDC).call();
    const bathQuoteSupply = await bathUsdcContractKovan.methods.totalSupply().call();
    const bathAssetSupply = await contractBP.methods.totalSupply().call();
    // console.log('Current asset liquidity balance: ', web3.utils.fromWei(assetBalance),  ticker);
    // console.log('Current quote liquidity balance: ', web3.utils.fromWei(quoteBalance), "USDC");

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
async function startBot(token, spread) {
    setTimeout(async function() {
        // Returns best bid and ask price
        await stoikov(token).then(async function(data) {
            var currentAsk = data[0];
            var currentBid = data[1];
            
            // Returns a pair overweight
            const IMfactor = checkInventory(currentAsk, currentBid, token);
            
            // Sends a scrubBath() call
            await checkForScrub(token);

            // Sends executeTransaction()
            await marketMake(currentAsk, currentBid, token, IMfactor, spread);
        });
        console.log('\n⚔⚔⚔ Strategist Bot Market Makes with Diligence and Valor ⚔⚔⚔\n');

      // Again
      startBot(token, spread);

      // Every 6 sec
    }, 2500);
}

console.log('\n<* Strategist Bot Begins its Service to Rubicon *>\n');

// **** Key inputs ****
const asset = "WBTC";

startBot(asset, 0.02);
startBot(asset, 0.03);
startBot(asset, 0.05);
startBot(asset, 0.06);

// startBot("MKR");



