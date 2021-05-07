require('dotenv').config();
var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");
var BathHouse = artifacts.require("./contracts/rubiconPoolsv0/BathHouse.sol");
var PairsTrade = artifacts.require("./contracts/PairsTrade.sol");

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

// This file will deploy Rubicon Market and Pools while wrapping everything in upgradeable proxies
module.exports = async function(deployer, network, accounts) {
    //Use below line for only migrating this file
    //truffle migrate -f 3 --network kovan

    // Deploy the Exchange, Pools, and main PairsTrade
    // TODO: wrap this in upgradeable proxies
    if (network == 'development' || network == 'pools'){
    await deployer.deploy(RubiconMarket).then(function() {
          return deployer.deploy(BathHouse).then(function() {
            return deployer.deploy(PairsTrade, "Pairs Trade", BathHouse.address, RubiconMarket.address);
          }); 
      });
      }

    // Deploy Pools and PairsTrade pointed at existing Kovan Exchange
    if (network == 'kovan'){
      await  deployer.deploy(BathHouse, { gas: 12487782 }).then(function() {
        return deployer.deploy(PairsTrade, "Pairs Trade", BathHouse.address, process.env.RUBICONMARKET_V0_KOVAN), { gas: 12487782 };
         }); 
      bathHouseInstance = await BathHouse.deployed();
      await bathHouseInstance.initialize(process.env.RUBICONMARKET_V0_KOVAN);
      console.log('Kovan BathHouse Address: ', BathHouse.address);
      console.log('Kovan PairsTrade Address: ', PairsTrade.address);
    }
};
