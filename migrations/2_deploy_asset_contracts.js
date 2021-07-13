var WETH = artifacts.require("./contracts/WETH9.sol");
var DAI = artifacts.require("./contracts/peripheral_contracts/DaiWithFaucet.sol");
var WAYNE = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var STARK = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");

var GME = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var OPT = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var SPXE = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var WBTC = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var COIN = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");

const BigNumber = require('bignumber.js');

module.exports = function(deployer, network, accounts) {

  var admin = process.env.OP_KOVAN_ADMIN;
  // Core Assets (Asset / Quote) used in protocol testing
  deployer.deploy(WETH);
  deployer.deploy(DAI, 42, admin, "USDC", "USDC");
  // deployer.deploy(STARK, admin, new BigNumber(1000e18));

  // deployer.deploy(GME, admin, new BigNumber(1000e18));
  // deployer.deploy(OPT, admin, new BigNumber(1000e18));
  // deployer.deploy(SPXE, admin, new BigNumber(1000e18));
  // deployer.deploy(WBTC, admin, new BigNumber(1000e18));
  // deployer.deploy(COIN, admin, new BigNumber(1000e18));
  // deployer.deploy(RBCN, admin, admin);
};
