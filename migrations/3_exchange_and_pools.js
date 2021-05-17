require('dotenv').config();
var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");
var BathHouse = artifacts.require("./contracts/rubiconPoolsv0/BathHouse.sol");
var PairsTrade = artifacts.require("./contracts/PairsTrade.sol");

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

// This file will deploy Rubicon Market and Pools while wrapping everything in upgradeable proxies
// @dev - use: ganache-cli --gasLimit=0x1fffffffffffff --gasPrice=0x1 --allowUnlimitedContractSize --defaultBalanceEther 9000
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
    if (network == 'kovan' || network == 'kovan-fork'){
      // await deployer.deploy(RubiconMarket);
      // rubiconMarketInstance = await RubiconMarket.deployed();
      // await rubiconMarketInstance.initialize(false, process.env.EXCHANGE_LAUNCH_ADDRESS_KOVAN);
      // console.log("Rubicon Market Address: ", rubiconMarketInstance.address);

      // Add launch tokens to the whitelist
      // await rubiconMarketInstance.addToWhitelist(process.env.OP_WAYNE);
      // await rubiconMarketInstance.addToWhitelist(process.env.OP_STARK);
      // await rubiconMarketInstance.addToWhitelist(process.env.OP_USDC);

      // await  deployer.deploy(BathHouse).then(function() {
      //   return deployer.deploy(PairsTrade, "Pairs Trade", BathHouse.address, process.env.RUBICONMARKET_V0_KOVAN);
      //    }); 

      // await bathHouseInstance.initialize(process.env.RUBICONMARKET_V0_KOVAN);
     
      // // Initialize WETH and DAI bathTokens and Pools
      // (await bathHouseInstance.initBathPair(process.env.KOVAN_WETH, "WETH", process.env.KOVAN_DAI, "DAI", 90, 259200, 10)); // 90% reserve ratio and 3 days cancel delay
      // newPair = await bathHouseInstance.getBathPair(process.env.KOVAN_WETH, process.env.KOVAN_DAI);
      // bathPairInstance = await BathPair.at(newPair);

      // bathAssetAddress = await bathPairInstance.bathAssetAddress();
      // bathQuoteAddress = await bathPairInstance.bathQuoteAddress();
      
      // console.log('Kovan BathHouse Address: ', BathHouse.address);
      // console.log('Kovan PairsTrade Address: ', PairsTrade.address);
      // console.log('Kovan bathWETH Address: ', bathAssetAddress);
      // console.log('Kovan bathDAI Address: ', bathQuoteAddress);
    }
};
