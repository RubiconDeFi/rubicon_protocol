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
let web3 = new Web3("https://optimism-kovan.infura.io/v3/" + process.env.INFURA_API_KEY);

// OP Kovan
// let web3 = new Web3("https://kovan.optimism.io");
// console.log("Web3 Version: ", web3.version);

// Load the RubiconMarket contract
var { abi } = require("../build/contracts/RubiconMarket.json");
// var rubiconMarketKovanAddr = process.env.OP_KOVAN_2_MARKET;
var rubiconMarketKovanAddr = process.env.OP_KOVAN_2_MARKET;
var RubiconMarketContractKovan = new web3.eth.Contract(abi, rubiconMarketKovanAddr);

// Load in Pools contract addresses on Kovan
var { abi } = require("../build/contracts/BathHouse.json");
var bathHouseKovanAddr = process.env.OP_KOVAN_2_BATHHOUSE;
var bathHouseContractKovan = new web3.eth.Contract(abi, bathHouseKovanAddr);

// Load in bath token asset contract addresses on Kovan
var { abi } = require("../build/contracts/BathToken.json");
var bathWayneKovanAddr = process.env.OP_KOVAN_2_BATHWBTC;
var bathWayneContractKovan = new web3.eth.Contract(abi, bathWayneKovanAddr);

// Load in bath token quote contract addresses on Kovan
var { abi } = require("../build/contracts/BathToken.json");
var bathUsdcKovanAddr = process.env.OP_KOVAN_2_BATHUSDC;
var bathUsdcContractKovan = new web3.eth.Contract(abi, bathUsdcKovanAddr);

var { abi } = require("../build/contracts/BidAskUtil.json");
var strategyKovanAddr = process.env.OP_KOVAN_2_BIDASKUTIL;
var strategyContractKovan = new web3.eth.Contract(abi, strategyKovanAddr);

// Load in WAYNE Contract
var { abi } = require("../build/contracts/EquityToken.json");
var WAYNEKovanAddr = process.env.OP_KOVAN_TC_WBTC;
var WAYNEContractKovan = new web3.eth.Contract(abi, WAYNEKovanAddr);

// Load in Dai Contract
var { abi } = require("../build/contracts/DaiWithFaucet.json");
var USDC_OP_KOVAN = process.env.OP_KOVAN_TC_USDC;
var DAIContractKovan = new web3.eth.Contract(abi, USDC_OP_KOVAN);

// Load in BathPair Contract
var { abi } = require("../build/contracts/BathPair.json");
const { ethers } = require('ethers');
var bathPairKovanAddr = process.env.OP_KOVAN_TC_BATHWBTCUSDC;
var bathPairContractKovan = new web3.eth.Contract(abi, bathPairKovanAddr);

// // // // ------------------- Validate Migrations ------------------
// //  BATH HOUSE
// // Strategy is Approved
bathHouseContractKovan.methods.isApprovedStrat(process.env.OP_KOVAN_2_BIDASKUTIL).call().then((r) => {
    if (r == true) {console.log("BH isApprovedStrat CORRECT")} else {console.log("BH isApprovedStrat ** ERROR **")}
});
bathHouseContractKovan.methods.isApprovedPair(process.env.OP_KOVAN_2_BATHWBTCUSDC).call().then((r) => {
if (r == true) {console.log("BH isApprovedPair CORRECT")} else {console.log("BH isApprovedPair ** ERROR **")}
});

bathHouseContractKovan.methods.getMarket().call().then((r) => {
    if (r == process.env.OP_KOVAN_2_MARKET) {console.log("BH getMarket CORRECT")} else {console.log("getMarket ** ERROR **")}
});
bathHouseContractKovan.methods.getBathPair(process.env.OP_KOVAN_TC_WBTC, process.env.OP_KOVAN_TC_USDC).call().then((r) => {
    // console.log(r);
    if (r == process.env.OP_KOVAN_2_BATHWBTCUSDC) {console.log("BH getBathPair CORRECT")} else {console.log("BH getBathPair ** ERROR **")}
});

//  BATH TOKENS
bathUsdcContractKovan.methods.symbol().call().then((r) =>{
    if (r == "bathUSDC") {console.log("BTUSDC symbol CORRECT")} else {console.log("BTUSDC symbol ** ERROR **", r)}
});
bathUsdcContractKovan.methods.initialized().call().then((r) =>{
    if (r == true) {console.log("BTUSDC initialized CORRECT")} else {console.log("BTUSDC initi ** ERROR **", r)}
});
bathUsdcContractKovan.methods.bathHouse().call().then((r) =>{
    if (r == process.env.OP_KOVAN_2_BATHHOUSE) {console.log("BTUSDC bathHouse CORRECT")} else {console.log("BTUSDC bathHouse ** ERROR **", r)}
});
bathUsdcContractKovan.methods.RubiconMarketAddress().call().then((r) =>{
    if (r == process.env.OP_KOVAN_2_MARKET) {console.log("BTUSDC market CORRECT")} else {console.log("BTUSDC market ** ERROR **"), r}
});
bathUsdcContractKovan.methods.underlyingToken().call().then((r) =>{
    if (r == process.env.OP_KOVAN_TC_USDC) {console.log("BTUSDC underlyingToken CORRECT")} else {console.log("BTUSDC underlyingToken ** ERROR **")}
});

bathWayneContractKovan.methods.symbol().call().then((r) =>{
    if (r == "bathWBTC") {console.log("BTWBTC symbol CORRECT")} else {console.log("BTWAYNE symbol ** ERROR **",r )}
});
bathWayneContractKovan.methods.bathHouse().call().then((r) =>{
    if (r == process.env.OP_KOVAN_2_BATHHOUSE) {console.log("BTWAYNE bathHouse CORRECT")} else {console.log("BTWAYNE bathHouse ** ERROR **", r)}
});
bathWayneContractKovan.methods.RubiconMarketAddress().call().then((r) =>{
    if (r == process.env.OP_KOVAN_2_MARKET) {console.log("BTWAYNE market CORRECT")} else {console.log("BTWAYNE market ** ERROR **", r)}
});
bathWayneContractKovan.methods.underlyingToken().call().then((r) =>{
    if (r == process.env.OP_KOVAN_TC_WBTC) {console.log("BTWAYNE underlyingToken CORRECT")} else {console.log("BTWAYNE underlyingToken ** ERROR **", r)}
});
RubiconMarketContractKovan.methods.getMinSell(process.env.OP_KOVAN_TC_WBTC).call().then((r) => {
    console.log("min sell wayne: ", r)
});
RubiconMarketContractKovan.methods.initialized().call().then((r) => {
    console.log("Market is initialized", r)
});
RubiconMarketContractKovan.methods.owner().call().then((r) => {
    console.log("market owner", r);
});
RubiconMarketContractKovan.methods.matchingEnabled().call().then((r) => {
    console.log("Market matching is enabled", r)
});
RubiconMarketContractKovan.methods.buyEnabled().call().then((r) => {
    console.log("buy is enabled", r)
});
RubiconMarketContractKovan.methods.AqueductDistributionLive().call().then((r) => {
    console.log("Aqueduct", r)
});
// RubiconMarketContractKovan.methods.getBestOffer(process.env.OP_KOVAN_TC_USDC, process.env.OP_KOVAN_TC_WBTC).call().then((r) => {
//     console.log("best offer", r);
//     RubiconMarketContractKovan.methods.getOffer(r).call().then(async (s) => {
//         console.log("best offer INFO", s[2]);
//         var txData = RubiconMarketContractKovan.methods.buy(
//             r,
//             s[2]
//         ).encodeABI();
//         var tx = {
//             gas: 9000000,
//             data: txData.toString(),
//             gasLimit: 20000000,
//             from: process.env.OP_KOVAN_ADMIN.toString(),
//             to: process.env.OP_KOVAN_2_MARKET
//         };
//         RubiconMarketContractKovan.methods.buy(r,
//             s[2]).estimateGas(tx, async (r) => {console.log(await r)})
//         await sendTx(tx, "buy random market order", "lol");
        
//     });
// });

// // BATH PAIR
// Bath pair ask and bid 
bathPairContractKovan.methods.underlyingAsset().call().then((r) => {
    if (r == process.env.OP_KOVAN_TC_WBTC) {console.log("BP underlyingAsset CORRECT")} else {console.log("underlyingAsset ** ERROR **", r)}
});
bathPairContractKovan.methods.underlyingQuote().call().then((r) => {
    if (r == process.env.OP_KOVAN_TC_USDC) {console.log("BP underlyingQuote CORRECT")} else {console.log("underlyingQuote ** ERROR **", r)}
});
bathPairContractKovan.methods.initialized().call().then((r) =>{
    if (r == true) {console.log("BP initialized CORRECT")} else {console.log("BP initialized ** ERROR **")}
});
bathPairContractKovan.methods.bathHouse().call().then((r) =>{
    if (r == process.env.OP_KOVAN_TC_BATHHOUSE) {console.log("BP bathHouse CORRECT")} else {console.log("BP bathHouse ** ERROR **")}
});
bathPairContractKovan.methods.bathAssetAddress().call().then((r) =>{
    if (r == process.env.OP_KOVAN_TC_BATHWBTC) {console.log("BP bathWAYNE CORRECT")} else {console.log("BP bathWAYNE ** ERROR **")}
});
bathPairContractKovan.methods.bathQuoteAddress().call().then((r) =>{
    if (r == process.env.OP_KOVAN_TC_BATHUSDC) {console.log("BP bathUSDC CORRECT")} else {console.log("BP bathUSDC ** ERROR **")}
});
bathPairContractKovan.methods.bathQuoteAddress().call().then((r) =>{
    if (r == process.env.OP_KOVAN_TC_BATHUSDC) {console.log("BP bathUSDC CORRECT")} else {console.log("BP bathUSDC ** ERROR **")}
});