var WETH = artifacts.require("./contracts/WETH9.sol");
var DAI = artifacts.require("./contracts/Dai.sol");
var WAYNE = artifacts.require("./contracts/EquityToken.sol");
var STARK = artifacts.require("./contracts/EquityToken.sol");
const BigNumber = require('bignumber.js');

module.exports = function(deployer, network, accounts) {
  var admin = accounts[0];

  // deployer.deploy(RubiconMarket, 1735693261, {
  //   from: accounts[0]
  // }); //unix date in 2025
  deployer.deploy(WETH);
  deployer.deploy(DAI, 1);
  deployer.deploy(WAYNE,admin, new BigNumber(1000e18));
  deployer.deploy(STARK, admin, new BigNumber(1000e18));

};
