require('dotenv').config();
var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");
var BathHouse = artifacts.require("./contracts/rubiconPoolsv0/BathHouse.sol");
var Strategy = artifacts.require("./contracts/Strategy.sol");

// This file will deploy Rubicon Market and Pools while wrapping everything in upgradeable proxies
module.exports = function(deployer, network, accounts) {

    //Use below line for single contract deployment
    //truffle migrate -f 3 --network kovan
    deployer.deploy(RubiconMarket).then(function() {
          return deployer.deploy(BathHouse, RubiconMarket.address).then(function() {
            return deployer.deploy(Strategy, "Stoikov Market Making", BathHouse.address, RubiconMarket.address);
          }); 
      });
};
