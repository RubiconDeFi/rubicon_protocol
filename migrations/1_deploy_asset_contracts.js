var WETH = artifacts.require("./contracts/WETH9.sol");
var DAI = artifacts.require("./contracts/peripheral_contracts/USDCWithFaucet.sol");

module.exports = function(deployer, network, accounts) {
  var admin = accounts[0];
  deployer.deploy(WETH);
  deployer.deploy(DAI, 42, admin, "USDC", "USDC");

};
