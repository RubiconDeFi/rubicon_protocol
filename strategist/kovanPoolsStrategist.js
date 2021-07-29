const Web3 = require("web3");
const noncemanager = require("./nonceManager/noncemanager.js");

// var Contract = require('web3-eth-contract');
var fs = require("fs");
require("dotenv").config();
const BigNumber = require("bignumber.js");
BigNumber.config({ DECIMAL_PLACES: 18 });
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });
// ************ Rubicon Pools Kovan Setup ***************

// Initialize Web3
// Kovan
let web3 = new Web3(
  "https://optimism-kovan.infura.io/v3/" + process.env.INFURA_API_KEY
);

// OP Kovan
// let web3 = new Web3("https://kovan.optimism.io");
// console.log("Web3 Version: ", web3.version);

// Load the RubiconMarket contract
var { abi } = require("../build/contracts/RubiconMarket.json");
// var rubiconMarketKovanAddr = process.env.OP_KOVAN_3_MARKET;
var rubiconMarketKovanAddr = process.env.OP_KOVAN_3_MARKET;
var RubiconMarketContractKovan = new web3.eth.Contract(
  abi,
  rubiconMarketKovanAddr
);

// Load in Pools contract addresses on Kovan
var { abi } = require("../build/contracts/BathHouse.json");
var bathHouseKovanAddr = process.env.OP_KOVAN_3_BATHHOUSE;
var bathHouseContractKovan = new web3.eth.Contract(abi, bathHouseKovanAddr);

// Load in bath token asset contract addresses on Kovan
var { abi } = require("../build/contracts/BathToken.json");
var bathWayneKovanAddr = process.env.OP_KOVAN_3_BATHWBTC;
var bathWayneContractKovan = new web3.eth.Contract(abi, bathWayneKovanAddr);

// Load in bath token quote contract addresses on Kovan
var { abi } = require("../build/contracts/BathToken.json");
var bathUsdcKovanAddr = process.env.OP_KOVAN_3_BATHUSDC;
var bathUsdcContractKovan = new web3.eth.Contract(abi, bathUsdcKovanAddr);

var { abi } = require("../build/contracts/BidAskUtil.json");
var strategyKovanAddr = process.env.OP_KOVAN_3_BIDASKUTIL;
var strategyContractKovan = new web3.eth.Contract(abi, strategyKovanAddr);

// Load in WAYNE Contract
var { abi } = require("../build/contracts/EquityToken.json");
var WAYNEKovanAddr = process.env.OP_KOVAN_3_WBTC;
var WAYNEContractKovan = new web3.eth.Contract(abi, WAYNEKovanAddr);

// Load in Dai Contract
var { abi } = require("../build/contracts/USDCWithFaucet.json");
var USDC_OP_KOVAN = process.env.OP_KOVAN_3_USDC;
var DAIContractKovan = new web3.eth.Contract(abi, USDC_OP_KOVAN);

// Load in BathPair Contract
var { abi } = require("../build/contracts/BathPair.json");
const { ethers } = require("ethers");
var bathPairKovanAddr = process.env.OP_KOVAN_3_BATHWBTCUSDC;
var bathPairContractKovan = new web3.eth.Contract(abi, bathPairKovanAddr);

var sender = process.env.OP_KOVAN_ADMIN;
var key = process.env.OP_KOVAN_ADMIN_KEY;

// TODO: make this work at scale
// *** Nonce Manager ***
// https://ethereum.stackexchange.com/questions/39790/concurrency-patterns-for-account-nonce
// let nonceOffset = 0;
baseNonce = web3.eth.getTransactionCount(
  process.env.OP_KOVAN_ADMIN //, "pending"
);
// async function getNonce() {
//   return await baseNonce.then((nonce) => nonce + nonceOffset++);
// }

var nonceFunctionWeb3 = () => {
  return new Promise(async (resolve, reject) => {
    // console.log("asking web3 for current nonce..");
    const updatedNonce =
      (await web3.eth.getTransactionCount(process.env.OP_KOVAN_ADMIN)) - 1;
    setTimeout(resolve, 2000, updatedNonce);
  });
};

// returns the next Nonce
function getNonce() {
  return noncemanager
    .getInstance()
    .getTransactionPermission()
    .then(() => {
      const next = noncemanager.getInstance().getNextNonce();
      //   console.log("Next nonce", next);
      return next;
    });
}

async function initNonceManager() {
  //   console.log("base", await baseNonce);
  noncemanager.getInstance((await baseNonce) - 1, nonceFunctionWeb3);
}

async function sendTx(tx, msg, ticker) {
  tx.nonce = getNonce();

  tx.gasPrice = 15000000;
  tx.gasLimit = 13000000;
  tx.gas = 13000000;
  // console.log('outgoing transaction: ', tx);
  return web3.eth.accounts.signTransaction(tx, key).then((signedTx) => {
    web3.eth
      .sendSignedTransaction(signedTx.rawTransaction)
      .on("receipt", () => {})
      .then((r) => {
        console.log("*transaction success* " + ticker + " => " + msg);
        return true;
        // console.log(r);
      })
      .catch((c) => {
        console.log("** " + ticker + " Transaction Failed **");
        console.log(c);
        console.log("**************************************");
        return false;
      });
  });
}

async function getContractFromToken(ticker, contract) {
  // Load in Dai Contract
  var { abi } = require("../build/contracts/" + contract + ".json");
  if (contract == "BathToken") {
    var address = process.env["OP_KOVAN_3_BATH" + ticker];
  } else if (contract == "BathPair") {
    var address = process.env["OP_KOVAN_3_BATH" + ticker + "USDC"];
  } else if (contract == "EquityToken") {
    var address = process.env["OP_KOVAN_3_" + ticker];
  } else {
    throw "unhandled contract type";
  }
  return new web3.eth.Contract(abi, address);
}

//#region

// // // **Approve bathPair to recieve WAYNE and DAI first**
// var txData = WAYNEContractKovan.methods.approve(process.env.OP_KOVAN_3_BATHWBTC, web3.utils.toWei("10000000")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: WAYNEKovanAddr,
//     gasPrice: web3.utils.toWei("0", "Gwei")
// }
// // Send the transaction
// sendTx(tx, "Approve bathPair to recieve WAYNE");

// // setTimeout(() => {console.log('waiting for nonce update')}, 2000)

// var txData = DAIContractKovan.methods.approve(process.env.OP_KOVAN_3_BATHUSDC, web3.utils.toWei("30000000")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: USDC_OP_KOVAN,
//     gasPrice: web3.utils.toWei("0", "Gwei")
// }
// // Send the transaction
// sendTx(tx, "dai approve");
// ---------------------------------------------------------
// // Deposit WAYNE into BathToken WAYNE
// var txData = bathWayneContractKovan.methods.deposit(web3.utils.toWei("50")).encodeABI();
// var tx = {
//     gas: 12500000,
//     data: txData.toString(),
//     from: sender,
//     to: process.env.OP_KOVAN_BATHWAYNE,
//     gasPrice: web3.utils.toWei("0", "Gwei")
// }
// // Send the transaction
// sendTx(tx, "Deposit WAYNE into BathToken WAYNE");

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

// Will revert if no bathToken liquidity
// console.log(bathPairContractKovan.methods.getMaxOrderSize(process.env.OP_KOVAN_3_WBTC, process.env.OP_KOVAN_3_BATHWBTC).call().then((r) => console.log("POOLS Max order size for WBTC: " + web3.utils.fromWei(r))));
// console.log(bathPairContractKovan.methods.getMaxOrderSize(process.env.OP_KOVAN_3_USDC, process.env.OP_KOVAN_3_BATHUSDC).call().then((r) => console.log("POOLS Max order size for USDC: " + web3.utils.fromWei(r))));
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

async function stoikov(token) {
  var bestAsk = await RubiconMarketContractKovan.methods
    .getBestOffer(process.env["OP_KOVAN_3_" + token], USDC_OP_KOVAN)
    .call();
  var askInfo = await RubiconMarketContractKovan.methods
    .getOffer(bestAsk)
    .call();
  var bestAskPrice = askInfo[2] / askInfo[0];

  var bestBid = await RubiconMarketContractKovan.methods
    .getBestOffer(USDC_OP_KOVAN, process.env["OP_KOVAN_3_" + token])
    .call();
  var bidInfo = await RubiconMarketContractKovan.methods
    .getOffer(bestBid)
    .call();
  var bestBidPrice = bidInfo[0] / bidInfo[2];
  return [bestAskPrice, bestBidPrice];
}

async function logInfo(mA, mB, a, b, im) {
  console.log("---------- Market Information ----------");
  console.log("Current Best Ask Price: ", mA);
  console.log("Current Best Bid Price: ", mB);
  console.log("Current Midpoint Price: ", (mA + mB) / 2);
  console.log("\n---------- Pools Information ----------");
  console.log("New Pools Ask Price: ", a);
  console.log("New Pools Bid Price: ", b);
  console.log("Pools Inventory Ratio [(Quote / Asset) ~ 1]: ", im);

  // APR CALCULATIONS
  await bathWayneContractKovan.methods
    .totalSupply()
    .call()
    .then(async function (r) {
      // console.log("Total Supply of bathWAYNE: ", r);
      var underlying = await WAYNEContractKovan.methods
        .balanceOf(process.env.OP_KOVAN_3_BATHWBTC)
        .call();
      // console.log("Total Underlying: ", underlying);
      var uOverC = await (underlying / r);
      let naiveAPR;
      console.log("balanceOf underlying", underlying);
      console.log("totalSupply", r);

      if (uOverC >= 1) {
        naiveAPR =
          "+" +
          (((await (underlying / r)) - 1) * 100).toFixed(3).toString() +
          "%";
      } else {
        naiveAPR =
          "-" +
          ((1 - (await (underlying / r))) * 100).toFixed(3).toString() +
          "%";
      }
      console.log("Return on Assets for bathWAYNE since Inception: ", naiveAPR);
    });

  await bathUsdcContractKovan.methods
    .totalSupply()
    .call()
    .then(async function (r) {
      // console.log("Total Supply of bathWAYNE: ", r);
      var underlying = await DAIContractKovan.methods
        .balanceOf(process.env.OP_KOVAN_3_BATHUSDC)
        .call();
      // console.log("Total Underlying: ", underlying);
      var uOverC = await (underlying / r);
      let naiveAPR;
      if (uOverC >= 1) {
        naiveAPR =
          "+" +
          (((await (underlying / r)) - 1) * 100).toFixed(3).toString() +
          "%";
      } else {
        naiveAPR =
          "-" +
          ((1 - (await (underlying / r))) * 100).toFixed(3).toString() +
          "%";
      }
      console.log("Return on Assets for bathUSDC since Inception: ", naiveAPR);
    });
  console.log("--------------------------------------\n");
}

async function checkForScrub(ticker) {
  const contract = await getContractFromToken(ticker, "BathPair");
  // console.log("got this contract", contract);
  await contract.methods
    .getOutstandingPairCount()
    .call()
    .then(async (r) => {
      //   console.log("THIS MANY PAIRS for", ticker + ":", r);
      if (r > -1) {

        // Scrub the bath
        var txData = await contract.methods.bathScrub().encodeABI();
        var tx = {
          gas: 9530000,
          data: txData,
          from: process.env.OP_KOVAN_ADMIN.toString(),
          to: process.env["OP_KOVAN_3_BATH" + ticker + "USDC"],
          gasPrice: web3.utils.toWei("0.015", "Gwei"),
        };
        try {
          await contract.methods
            .bathScrub()
            .estimateGas(tx, async function (r, d) {
              if (r != null) {
                console.log(
                  "Got a problem estimating bathScrub for " + ticker,
                  r
                );
              }
              if (d > 0) {
                await sendTx(
                  tx,
                  "\n<* I have successfully scrubbed the " +
                    ticker +
                    " bath, Master *>\n",
                  ticker + " bath Scrub!"
                );
              } else {
                throw ("gas estimation in bathScrub failed for", ticker);
              }
            }); //.catch((e) => {console.log("failed to estimate gas for " + ticker + "bathScrub")})
        } catch (error) {
          console.log("failed to estimate gas for " + ticker + "bathScrub");
        }

      }
    });
}

let oldMidpoint = [];
let targetMidpoint = [];
async function marketMake(a, b, t, im, spread, tM) {

  const ticker = await t;
  const contract = await getContractFromToken(await ticker, "BathPair");
  // ***Market Maker Inputs***
  const targetSpread = await spread; // the % of the spread we want to improve
  const scaleBack = new BigNumber(10); // used to scale back maxOrderSize
  // *************************
  // Check if midpoint is unchanged before market making
  var midPoint = ((await a) + (await b)) / 2;
  if (midPoint == oldMidpoint[ticker]) {
    console.log(
      "\n<* Midpoint is Unchanged, Therefore I Continue My Watch*>\n"
    );
    return;
  } else if (midPoint == 0 || isNaN(midPoint)) {
    if (targetMidpoint[ticker] == undefined) {
      //   console.log("new target", tM);
      targetMidpoint[ticker] = tM;
    }
    midPoint = targetMidpoint[ticker];
  } else {
    oldMidpoint[ticker] = midPoint;
    targetMidpoint[ticker] = midPoint;
  }
  //   console.log("midPoint", midPoint);
  //   console.log("target midPoint", tM);


  await checkForScrub(t);

  var newBidPrice = new BigNumber(parseFloat(midPoint * (1 - targetSpread)));
  var newAskPrice = new BigNumber(parseFloat(midPoint * (1 + targetSpread)));

  // getMaxOrderSize from contract for bid and ask
  //   const maxAskSize = new BigNumber(
  //     await contract.methods
  //       .getMaxOrderSize(
  //         process.env["OP_KOVAN_3_" + (await ticker)],
  //         process.env["OP_KOVAN_3_BATH" + (await ticker)]
  //       )
  //       .call()
  //   );
  //   const maxBidSize = new BigNumber(
  //     await contract.methods
  //       .getMaxOrderSize(
  //         process.env.OP_KOVAN_3_USDC,
  //         process.env.OP_KOVAN_3_BATHUSDC
  //       )
  //       .call()
  //   );
  const maxAskSize = new BigNumber(420);
  const maxBidSize = new BigNumber(69);


  // in wei
  const askNum = maxAskSize.dividedBy(scaleBack);
  const askDen = askNum.multipliedBy(newAskPrice);

  const bidNum = maxBidSize.dividedBy(scaleBack);
  const bidDen = bidNum.dividedBy(newBidPrice);

  //   await logInfo(a, b, askDen / askNum, bidNum / bidDen, await im);


  var txData = contract.methods
    .executeStrategy(
      process.env.OP_KOVAN_3_BIDASKUTIL,
      web3.utils.toBN(askNum.decimalPlaces(0)),
      web3.utils.toBN(askDen.decimalPlaces(0)),
      web3.utils.toBN(bidNum.decimalPlaces(0)),
      web3.utils.toBN(bidDen.decimalPlaces(0))
    )
    .encodeABI();
  var tx = {
    gas: 9000000,
    data: txData.toString(),
    from: process.env.OP_KOVAN_ADMIN.toString(),
    to: process.env["OP_KOVAN_3_BATH" + (await ticker) + "USDC"],
    gasPrice: web3.utils.toWei("0", "Gwei"),
  };
  //   console.log('New ' + ticker + ' trades placed at [bid]: ' + newBidPrice.toString() + '$ and [ask]: ' + newAskPrice.toString()+'$' + '\n');
  // let result = await sendTx(
  //   tx,
  //   "New " +
  //     (await ticker) +
  //     " trades placed at [bid]: " +
  //     newBidPrice.toString() +
  //     "$ and [ask]: " +
  //     newAskPrice.toString() +
  //     "$" +
  //     "\n",
  //   ticker
  // );
  // if (result == true) {
  //   return;
  // } else {
  //   // if error, we want to change the midpoint so we try again
  //   oldMidpoint[ticker] = 0;
  // }

}

// This function should return a positive or negative number reflecting the balance.
async function checkInventory(currentAsk, currentBid, ticker) {
  const contractBP = await getContractFromToken(await ticker, "BathToken");
  const contractT = await getContractFromToken(await ticker, "EquityToken");

  var currentReserveRatio = 80.0 / 100.0;
  var assetBalance = await contractT.methods
    .balanceOf(process.env["OP_KOVAN_3_BATH" + ticker])
    .call();
  var quoteBalance = await DAIContractKovan.methods
    .balanceOf(process.env.OP_KOVAN_3_BATHUSDC)
    .call();
  const bathQuoteSupply = await bathUsdcContractKovan.methods
    .totalSupply()
    .call();
  const bathAssetSupply = await contractBP.methods.totalSupply().call();
  // console.log('Current asset liquidity balance: ', web3.utils.fromWei(assetBalance),  ticker);
  // console.log('Current quote liquidity balance: ', web3.utils.fromWei(quoteBalance), "USDC");

  if (assetBalance == 0 || quoteBalance == 0) {
    throw "ERROR: no liquidity in quote or asset bathToken";
  }
  if (bathAssetSupply * currentReserveRatio >= assetBalance) {
    console.log("Hurdle Rate: ", bathAssetSupply * currentReserveRatio);
    console.log("Asset balance: ", assetBalance);
    throw "ERROR: insufficient asset liquidity to clear reserve ratio";
  }
  if (bathQuoteSupply * currentReserveRatio >= quoteBalance) {
    console.log("Hurdle Rate: ", bathQuoteSupply * currentReserveRatio);
    console.log("Quote balance: ", assetBalance);
    throw "ERROR: insufficient quote liquidity to clear reserve ratio";
  }

  // Ratio targets the current orderbook midpoint as the ideal ratio (50/50)
  return quoteBalance / assetBalance / ((currentAsk + currentBid) / 2); // This number represents if the pair is overweight in one direction
}

// This function sets off the chain of calls to successfully marketMake with Pools
async function startBot(token, spread, tM) {
  setTimeout(async function () {
    // Returns best bid and ask price
    stoikov(token).then(async function (data) {

      var currentAsk = data[0];
      var currentBid = data[1];

      // Returns a pair overweight
      const IMfactor = checkInventory(currentAsk, currentBid, token);

      // Sends executeTransaction()
      await marketMake(
        currentAsk,
        currentBid,
        await token,
        await IMfactor,
        await spread,
        await tM

      );
    });
    console.log(
      "\n⚔⚔⚔ Strategist Bot Market Makes with Diligence and Valor ⚔⚔⚔\n"
    );

    // Again
    startBot(token, spread, tM);

    // Every 2.5 sec
  }, 3000);

}

console.log("\n<* Strategist Bot Begins its Service to Rubicon *>\n");

// **** Key inputs ****
const assets = [
  "WBTC",
  "MKR",
  "SNX",
  "REP",
  "RGT",
  "ETH",
  "COMP",
  "OHM",
  "AAVE",
];


initNonceManager().then(async () => {
  // startBot("RGT", 0.02, 5);
  // startBot("MKR", 0.02, 5);
  // await startBot("REP", 0.02, 5);

  // startBot("WBTC", 0.02, 5);

  //   console.log("got a nonce", await getNonce());
});

// // Start bots
// for (let index = 0; index < assets.length; index++) {
//     const element = assets[index];
//     startBot(element, 0.02);
//     // startBot(element, 0.04);
//     // startBot(element, 0.07);
// }

// startBot("WBTC", 0.02, 40000);

