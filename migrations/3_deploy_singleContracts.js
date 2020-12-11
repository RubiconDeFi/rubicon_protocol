var DAI2 = artifacts.require("./contracts/DaiWithFaucet.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(DAI2, 42);
};
