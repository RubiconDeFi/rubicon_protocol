const Web3 = require('web3');
// var Contract = require('web3-eth-contract');
var fs = require('fs');
require("dotenv");

// Initialize Web3
let web3 = new Web3("https://kovan.infura.io/v3/2989f59dba68436a9c9221bc6d1603d4");
// console.log("Web3 Version: ", web3.version);

// Load the RubiconMarket contract
var { abi } = require("../build/contracts/RubiconMarket.json");
var rubiconMarketKovanAddr = "0x8A4A4d9A874dc038c01638e003fF7307498103f6";
var RubiconMarketContractKovan = new web3.eth.Contract(abi, rubiconMarketKovanAddr);

// Load in Pools contract addresses on Kovan


// Pseudocode - As a loop:
// 1. Grab the current price for a Kovan pair
// 2. executeStrategy --> Place better a bid and ask at the best bid/ask - 1
// 3. Rinse repeat...

