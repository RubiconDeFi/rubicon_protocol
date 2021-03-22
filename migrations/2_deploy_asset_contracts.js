var WETH = artifacts.require("./contracts/WETH9.sol");
var DAI = artifacts.require("./contracts/peripheral_contracts/DaiWithFaucet.sol");
var WAYNE = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var STARK = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");

var GME = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var OPT = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var SPXE = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var WBTC = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");
var COIN = artifacts.require("./contracts/peripheral_contracts/EquityToken.sol");

var RBCN = artifacts.require("./contracts/RBCN.sol");

const BigNumber = require('bignumber.js');

module.exports = function(deployer, network, accounts) {
  var admin = "0x501D8Fa75DF1C0023F2798708b1995D6E09Cc58A";

  deployer.deploy(WETH);
  deployer.deploy(DAI, 42);

  // deployer.deploy(WAYNE,admin, new BigNumber(1000e18));
  // deployer.deploy(STARK, admin, new BigNumber(1000e18));



  // deployer.deploy(GME, admin, new BigNumber(1000e18));
  // deployer.deploy(OPT, admin, new BigNumber(1000e18));
  // deployer.deploy(SPXE, admin, new BigNumber(1000e18));
  // deployer.deploy(WBTC, admin, new BigNumber(1000e18));
  // deployer.deploy(COIN, admin, new BigNumber(1000e18));

  // deployer.deploy(RBCN, admin, admin);


};
