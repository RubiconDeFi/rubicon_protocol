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
    .timeDelay()
    .call()
    .then((r) => {
      console.log("Current Pools Time Delay in Days:", r / 86400);
    });
  bathHouseContractKovan.methods
    .maxOutstandingPairCount()
    .call()
    .then((r) => {
      console.log("Current Pools Max Orders:", r);
    });

  //  BATH TOKENS
  for (let index = 0; index < assetsBT.length; index++) {
    const element = assetsBT[index];
    let contract = await getContractFromToken(element, "BathToken");
    contract.methods
      .totalSupply()
      .call()
      .then(async (r) => {
        let und = await getContractFromToken(element, "EquityToken");
        und.methods
          .balanceOf(process.env["OP_KOVAN_3_BATH" + element])
          .call()
          .then((b) => {
            console.log(
              "**" + element + "**",
              "Total Supply:",
              r,
              "Underlying Balance:",
              b,
              "Gross ROA",
              b / r
            );
          });
      });
  }

  //  BATH TOKENS
  for (let index = 0; index < assetsBT.length; index++) {
    const element = assetsBT[index];
    let contract = await getContractFromToken(element, "BathToken");
    contract.methods
      .totalSupply()
      .call()
      .then(async (r) => {
        contract.methods
          .underlyingBalance()
          .call()
          .then((b) => {
            console.log(
              "**" + element + "**",
              "Total Supply:",
              r,
              "Underlying Balance ** Modified:",
              b,
              "Gross ROA",
              b / r
            );
          });
        await contract.methods
          .outstandingAmount()
          .call()
          .then((r) => {
            console.log("outstandingAmount for " + element + " " + web3.utils.fromWei(r));
          });
      });
  }
}

validate();