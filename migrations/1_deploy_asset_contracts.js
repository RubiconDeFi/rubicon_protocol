var WETH = artifacts.require("./contracts/WETH9.sol");
var DAI = artifacts.require("./contracts/peripheral_contracts/USDCWithFaucet.sol");
var WAYNE = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var STARK = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");

var GME = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var OPT = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var SPXE = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var WBTC = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var COIN = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");

const BigNumber = require('bignumber.js');

module.exports = function(deployer, network, accounts) {
  var admin = accounts[0];
  deployer.deploy(WETH);
  deployer.deploy(DAI, 42, admin, "USDC", "USDC");

};
