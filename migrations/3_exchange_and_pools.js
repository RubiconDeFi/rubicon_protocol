require('dotenv').config();
var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");
var BathHouse = artifacts.require("./contracts/rubiconPoolsv0/BathHouse.sol");
var Strategy = artifacts.require("./contracts/Strategy.sol");

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

// This file will deploy Rubicon Market and Pools while wrapping everything in upgradeable proxies
module.exports = async function(deployer, network, accounts) {
    //Use below line for only migrating this file
    //truffle migrate -f 3 --network kovan

    // Deploy the Exchange, Pools, and main Strategy
    // TODO: wrap this in upgradeable proxies
    if (network == 'development' || network == 'pools'){
    await deployer.deploy(RubiconMarket).then(function() {
          return deployer.deploy(BathHouse).then(function() {
            return deployer.deploy(Strategy, "Stoikov Market Making", BathHouse.address, RubiconMarket.address);
          }); 
      });
      }

    // Deploy Pools and Strategy pointed at existing Kovan Exchange
    if (network == 'kovan'){
      await  deployer.deploy(BathHouse).then(function() {
        return deployer.deploy(Strategy, "Stoikov Market Making", BathHouse.address, process.env.RUBICONMARKET_V0_KOVAN);
         }); 
      bathHouseInstance = await BathHouse.deployed();
      await bathHouseInstance.initialize(process.env.RUBICONMARKET_V0_KOVAN);
      console.log('Kovan BathHouse Address: ', BathHouse.address);
      console.log('Kovan Strategy Address: ', Strategy.address);
    }
};
