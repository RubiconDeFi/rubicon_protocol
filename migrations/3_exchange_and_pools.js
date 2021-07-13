require('dotenv').config();
var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");
var BathHouse = artifacts.require("./contracts/rubiconPoolsv0/BathHouse.sol");
var BathPair = artifacts.require("./contracts/rubiconPoolsv0/BathPair.sol");
var BathToken = artifacts.require("./contracts/rubiconPoolsv0/BathToken.sol");
var BidAskUtil = artifacts.require("./contracts/BidAskUtil.sol");

var WETH = artifacts.require("./contracts/WETH9.sol");
var DAI = artifacts.require("./contracts/peripheral_contracts/DaiWithFaucet.sol");

const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const { deploy } = require('@openzeppelin/truffle-upgrades/dist/utils');

// This file will deploy Rubicon Market and Pools while wrapping everything in upgradeable proxies
// @dev - use: ganache-cli --gasLimit=0x1fffffffffffff --gasPrice=0x1 --allowUnlimitedContractSize --defaultBalanceEther 9000
module.exports = async function(deployer, network, accounts) {
    // Use accounts[0] for testing purposes
    var admin = accounts[0];

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

            return deployer.deploy(BathHouse).then(async function() {
              await deployer.deploy(BathPair);
              return deployer.deploy(BidAskUtil, "Pairs Trade", BathHouse.address, RubiconMarket.address,/* {gas: 0x1ffffff}*/);
            }); 
        });
      }
};
