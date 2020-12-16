var WETH = artifacts.require("./contracts/WETH9.sol");
var DAI = artifacts.require("./contracts/DaiWithFaucet.sol");
var WAYNE = artifacts.require("./contracts/EquityToken.sol");
var STARK = artifacts.require("./contracts/EquityToken.sol");
const BigNumber = require('bignumber.js');

module.exports = function(deployer, network, accounts) {
  var admin = accounts[0];
  deployer.deploy(WETH);
  deployer.deploy(DAI, 42);
  deployer.deploy(WAYNE,admin, new BigNumber(1000e18));
  deployer.deploy(STARK, admin, new BigNumber(1000e18));

};
