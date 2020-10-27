var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");
var WETH = artifacts.require("./contracts/WETH9.sol");
var DAI = artifacts.require("./contracts/Dai.sol");
// Below are mock Equity Tokens for the purposes of a UI screenshot
var WAYNE = artifacts.require("./contracts/EquityToken.sol");
var STARK = artifacts.require("./contracts/EquityToken.sol");
const BigNumber = require('bignumber.js');

//accounts[0] must act as admin to deploy all contracts and recieve all RBCN, RBCN
module.exports = function(deployer, network, accounts) {
  // var admin = accounts[0];
  var admin = "0xc1ce067283F92746708FF70aC406bf8F045481Df";

  deployer.deploy(RubiconMarket, 1735693261, {
    from: accounts[0]
  }); //unix date in 2025
  deployer.deploy(WETH);
  deployer.deploy(DAI, 1);
  deployer.deploy(WAYNE,admin, new BigNumber(1000e18));
  deployer.deploy(STARK, admin, new BigNumber(1000e18));

};
