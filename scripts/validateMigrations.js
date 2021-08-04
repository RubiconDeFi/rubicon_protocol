const Web3 = require("web3");
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

var { abi } = require("../build/contracts/BidAskUtil.json");
var strategyKovanAddr = process.env.OP_KOVAN_3_BIDASKUTIL;
var strategyContractKovan = new web3.eth.Contract(abi, strategyKovanAddr);

//  ** Inputs **

const assetsBT = [
  "WBTC",
  "MKR",
  "SNX",
  "REP",
  "RGT",
  "ETH",
  "USDC",
  "OHM",
  "COMP",
  "AAVE",
];
const assetsBP = [
  "WBTC",
  "MKR",
  "SNX",
  "REP",
  "RGT",
  "ETH",
  "OHM",
  "COMP",
  "AAVE",
]; //assets with no quotes
const quotes = ["USDC"];

const contractAdmin = process.env.OP_KOVAN_ADMIN;
const proxyAdmin = process.env.OP_KOVAN_PROXY_ADMIN;
const feeRecipient = process.env.OP_KOVAN_TC_FEE_RECIPIENT;
const strategist = contractAdmin;

//  ** Helper Functions **

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

// ------------------- Validate Migrations ------------------
async function validate() {
  //  BATH HOUSE
  bathHouseContractKovan.methods
    .getMarket()
    .call()
    .then((r) => {
      if (r == process.env.OP_KOVAN_3_MARKET) {
        console.log("BH getMarket CORRECT");
      } else {
        console.log("getMarket ** ERROR **");
      }
    });
  bathHouseContractKovan.methods
    .admin()
    .call()
    .then((r) => {
      if (r == contractAdmin) {
        console.log("BH admin CORRECT");
      } else {
        console.log("BH admin ** ERROR **");
      }
    });
  bathHouseContractKovan.methods
    .name()
    .call()
    .then((r) => {
      if (r == "Rubicon Bath House") {
        console.log("BH name CORRECT");
      } else {
        console.log("BH name ** ERROR **");
      }
    });
  bathHouseContractKovan.methods
    .getBathPair(process.env.OP_KOVAN_3_WBTC, process.env.OP_KOVAN_3_USDC)
    .call()
    .then((r) => {
      // console.log(r);
      if (r == process.env.OP_KOVAN_3_BATHWBTCUSDC) {
        console.log("BH getBathPair CORRECT");
      } else {
        console.log("BH getBathPair ** ERROR **");
      }
    });

  //  BATH TOKENS
  for (let index = 0; index < assetsBT.length; index++) {
    const element = assetsBT[index];
    let contract = await getContractFromToken(element, "BathToken");
    contract.methods
      .symbol()
      .call()
      .then((r) => {
        if (r == "bath" + element) {
          console.log("bath" + element + " symbol CORRECT");
        } else {
          console.log("bath" + element + " symbol ** ERROR **", r);
        }
      });
    contract.methods
      .initialized()
      .call()
      .then((r) => {
        if (r == true) {
          console.log("bath" + element + " initialized CORRECT");
        } else {
          console.log("bath" + element + " ** ERROR **", r);
        }
      });
    contract.methods
      .bathHouse()
      .call()
      .then((r) => {
        if (r == process.env.OP_KOVAN_3_BATHHOUSE) {
          console.log("bath" + element + " bathHouse CORRECT");
        } else {
          console.log("bath" + element + " bathHouse ** ERROR **", r);
        }
      });
    contract.methods
      .feeTo()
      .call()
      .then((r) => {
        if (r == feeRecipient) {
          console.log("bath" + element + " feeTo CORRECT");
        } else {
          console.log("bath" + element + " feeTo ** ERROR **", r);
        }
      });
    contract.methods
      .RubiconMarketAddress()
      .call()
      .then((r) => {
        if (r == process.env.OP_KOVAN_3_MARKET) {
          console.log("bath" + element + " market CORRECT");
        } else {
          console.log("bath" + element + " market ** ERROR **"), r;
        }
      });
    contract.methods
      .underlyingToken()
      .call()
      .then((r) => {
        if (r == process.env["OP_KOVAN_3_" + element]) {
          console.log("bath" + element + " underlyingToken CORRECT");
        } else {
          console.log("bath" + element + " underlyingToken ** ERROR **");
        }
      });
  }

  // BidAskUtil
  strategyContractKovan.methods
    .initialized()
    .call()
    .then((r) => {
      if (r == true) {
        console.log("BIDASKUTIL initialized CORRECT");
      } else {
        console.log("BIDASKUTIL initialized ** ERROR **");
      }
    });
  bathHouseContractKovan.methods
    .isApprovedStrat(process.env.OP_KOVAN_3_BIDASKUTIL)
    .call()
    .then((r) => {
      if (r == true) {
        console.log("BIDASKUTIL isApprovedStrat on BH CORRECT");
      } else {
        console.log("BIDASKUTIL isApprovedStrat on BH ** ERROR **");
      }
    });

  // Market
  RubiconMarketContractKovan.methods
    .getMinSell(process.env.OP_KOVAN_3_WBTC)
    .call()
    .then((r) => {
      if (r == 0) {
        console.log("MARKET min sell asset CORRECT");
      } else {
        console.log("MARKET min sell asset ** ERROR **");
      }
    });
  RubiconMarketContractKovan.methods
    .initialized()
    .call()
    .then((r) => {
      if (r == true) {
        console.log("MARKET initialized CORRECT");
      } else {
        console.log("MARKET initialized ** ERROR **");
      }
    });
  RubiconMarketContractKovan.methods
    .owner()
    .call()
    .then((r) => {
      if (r == process.env.OP_KOVAN_ADMIN) {
        console.log("MARKET owner CORRECT");
      } else {
        console.log("MARKET owner ** ERROR **");
      }
    });
  RubiconMarketContractKovan.methods
    .matchingEnabled()
    .call()
    .then((r) => {
      if (r == true) {
        console.log("MARKET matchingEnabled CORRECT");
      } else {
        console.log("MARKET matchingEnabled ** ERROR **");
      }
    });
  RubiconMarketContractKovan.methods
    .buyEnabled()
    .call()
    .then((r) => {
      if (r == true) {
        console.log("MARKET buyEnabled CORRECT");
      } else {
        console.log("MARKET buyEnabled ** ERROR **");
      }
    });
  RubiconMarketContractKovan.methods
    .AqueductDistributionLive()
    .call()
    .then((r) => {
      if (r == false) {
        console.log("MARKET AqueductDistributionLive CORRECT");
      } else {
        console.log("MARKET AqueductDistributionLive ** ERROR **");
      }
    });

  // // BATH PAIR
  // Bath pair ask and bid
  for (let ind = 0; ind < quotes.length; ind++) {
    const q = quotes[ind];
    for (let index = 0; index < assetsBP.length; index++) {
      const element = assetsBP[index];
      let contract = await getContractFromToken(element, "BathPair");

      contract.methods
        .underlyingAsset()
        .call()
        .then((r) => {
          if (r == process.env["OP_KOVAN_3_" + element]) {
            console.log("bath" + element + q + " underlyingAsset CORRECT");
          } else {
            console.log(
              "bath" + element + q + " underlyingAsset ** ERROR **",
              r
            );
          }
        });
      contract.methods
        .getSearchRadius()
        .call()
        .then((r) => {
          if (r == 3) {
            console.log("bath" + element + q + " searchRadius CORRECT");
          } else {
            console.log(
              "bath" + element + q + " searchRadius ** ERROR **",
              r
            );
          }
        });
      contract.methods
        .underlyingQuote()
        .call()
        .then((r) => {
          if (r == process.env.OP_KOVAN_3_USDC) {
            console.log("bath" + element + q + " underlyingQuote CORRECT");
          } else {
            console.log(
              "bath" + element + q + " underlyingQuote ** ERROR **",
              r
            );
          }
        });
      contract.methods
        .initialized()
        .call()
        .then((r) => {
          if (r == true) {
            console.log("bath" + element + q + " initialized CORRECT");
          } else {
            console.log("bath" + element + q + " initialized ** ERROR **");
          }
        });
      contract.methods
        .bathHouse()
        .call()
        .then((r) => {
          if (r == process.env.OP_KOVAN_3_BATHHOUSE) {
            console.log("bath" + element + q + " bathHouse CORRECT");
          } else {
            console.log("bath" + element + q + " bathHouse ** ERROR **");
          }
        });
      contract.methods
        .bathAssetAddress()
        .call()
        .then((r) => {
          if (r == process.env["OP_KOVAN_3_BATH" + element]) {
            console.log("bath" + element + q + " bathAssetAddress CORRECT");
          } else {
            console.log("bath" + element + q + " bathAssetAddress ** ERROR **");
          }
        });
      contract.methods
        .bathQuoteAddress()
        .call()
        .then((r) => {
          if (r == process.env["OP_KOVAN_3_BATH" + q]) {
            console.log("bath" + element + q + " bathQuoteAddress CORRECT");
          } else {
            console.log("bath" + element + q + " bathQuoteAddress ** ERROR **");
          }
        });
      bathHouseContractKovan.methods
        .isApprovedPair(process.env["OP_KOVAN_3_BATH" + element + q])
        .call()
        .then((r) => {
          if (r == true) {
            console.log(
              "bath" + element + q + " BathHouse isApprovedPair CORRECT"
            );
          } else {
            console.log(
              "bath" + element + q + " BathHouse isApprovedPair ** ERROR **"
            );
          }
        });
    }
  }

  // Check strategist
  bathHouseContractKovan.methods
    .isApprovedStrategist(strategist)
    .call()
    .then((r) => {
      if (r == true) {
        console.log("BathHouse isApprovedStrategist CORRECT");
      } else {
        console.log("BathHouse isApprovedStrategist ** ERROR **");
      }
    });
}

validate();
