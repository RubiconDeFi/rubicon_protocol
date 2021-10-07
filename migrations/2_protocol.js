require('dotenv').config();
var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");
var RubiconRouter = artifacts.require("./contracts/RubiconRouter.sol");
var BathHouse = artifacts.require("./contracts/rubiconPoolsv0/BathHouse.sol");
var BathPair = artifacts.require("./contracts/rubiconPoolsv0/BathPair.sol");

// @dev - use: ganache-cli --gasLimit=0x1fffffffffffff --gasPrice=0x1 --allowUnlimitedContractSize --defaultBalanceEther 9000
module.exports = async function(deployer, network, accounts) {
    // Use accounts[0] for testing purposes
    var admin = accounts[0];

    if (network == 'development' || network == 'pools' || network == "kovan" || network == "ganache" || network == "kovan-fork"){
      await deployer.deploy(RubiconMarket, /*{gasPrice: 1, gas: 0x1fffffffffffff}*/).then(async function() {
            rubiconMarketInstance = await RubiconMarket.deployed();

            // Initialize immediately on deployment
            await rubiconMarketInstance.initialize(false, admin);

            await deployer.deploy(BathHouse).then(async function() {
              await deployer.deploy(BathPair);
              return;
            });
            
            // Deploy Router
            await deployer.deploy(RubiconRouter);
            let routerI = await RubiconRouter.deployed();
            await routerI.initialize(rubiconMarketInstance.address);
        });
      }
};
