require('dotenv').config();
var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");
var BathHouse = artifacts.require("./contracts/rubiconPoolsv0/BathHouse.sol");
var BathPair = artifacts.require("./contracts/rubiconPoolsv0/BathPair.sol");
var BathToken = artifacts.require("./contracts/rubiconPoolsv0/BathToken.sol");
var PairsTrade = artifacts.require("./contracts/PairsTrade.sol");

var WETH = artifacts.require("./contracts/WETH9.sol");
var DAI = artifacts.require("./contracts/peripheral_contracts/DaiWithFaucet.sol");

const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const { deploy } = require('@openzeppelin/truffle-upgrades/dist/utils');

// This file will deploy Rubicon Market and Pools while wrapping everything in upgradeable proxies
// @dev - use: ganache-cli --gasLimit=0x1fffffffffffff --gasPrice=0x1 --allowUnlimitedContractSize --defaultBalanceEther 9000
module.exports = async function(deployer, network, accounts) {
    //Use below line for only migrating this file
    //truffle migrate -f 3 --network kovan

    // Deploy the Exchange, Pools, and main PairsTrade
    // TODO: wrap this in upgradeable proxies

    // Use accounts[0] for testing purposes
    var admin = accounts[0];

    // Hardcode admin for network deployments
    // var admin = "0xC96495C314879586761d991a2B68ebeab12C03FE";
    // var assetsToWhitelist = [
    //   "0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0", //WETH
    //   "0xF12b5dd4EAD5F743C6BaA640B0216200e89B60Da", //USDC
    //   "0x345cA3e014Aaf5dcA488057592ee47305D9B3e10", //WAYNE
    //   "0xf25186B5081Ff5cE73482AD761DB0eB0d25abfBF", //STARK
    //   "0x8f0483125FCb9aaAEFA9209D8E9d7b9C8B9Fb90F", //GME
    //   "0x9FBDa871d559710256a2502A2517b794B482Db40", //OPT
    //   "0x2C2B9C9a4a25e24B174f26114e8926a9f2128FE4", //SPXE
    //   "0x30753E4A8aad7F8597332E813735Def5dD395028", //WBTC
    //   "0xFB88dE099e13c3ED21F80a7a1E49f8CAEcF10df6", //COIN
    //   "0xAa588d3737B611baFD7bD713445b314BD453a5C8"  //RBCN
    // ];

    if (network == 'development' || network == 'pools' || network == "kovan" || network == "ganache" || network == "kovan-fork"){
      await deployer.deploy(RubiconMarket, /*{gasPrice: 1, gas: 0x1fffffffffffff}*/).then(async function() {
            rubiconMarketInstance = await RubiconMarket.deployed();

            // Initialize immediately on deployment
            await rubiconMarketInstance.initialize(false, admin);

            // Deploy liquidity pools for WETH / DAI - see 3_pool_test.js
            wethInstance = await WETH.deployed();
            daiInstance = await DAI.deployed();

            // await deployer.deploy(BathToken)
            // rubiconMarketInstance = await RubiconMarket.deployed();

            // Add launch tokens to the whitelist
            // assetsToWhitelist.forEach(async function(e) {
            //   await rubiconMarketInstance.addToWhitelist(e);   
            // });
            return deployer.deploy(BathHouse, /*{gasPrice: 1, gas: 0x1fffffffffffff}*/).then(async function() {
              // bathHouseInstance = await BathHouse.deployed();
              
              // await deployer.deploy(BathToken);
              // await deployer.deploy(BathToken);

              await deployer.deploy(BathPair,
                  // wethInstance.address,
                  // "WETH",
                  // daiInstance.address,
                  // "DAI",
                  // rubiconMarketInstance.address,
                  // 90,
                  // 259200,
                  // 10,
                  // BathHouse.address
                );
              return deployer.deploy(PairsTrade, "Pairs Trade", BathHouse.address, RubiconMarket.address,/* {gas: 0x1ffffff}*/);
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
      // await rubiconMarketInstance.addToWhitelist(process.env.KOVAN_WAYNE);
      // await rubiconMarketInstance.addToWhitelist(process.env.KOVAN_DAI);

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
