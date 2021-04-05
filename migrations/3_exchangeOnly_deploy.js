require('dotenv').config();
var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");

module.exports = function(deployer, network, accounts) {

    //Toggle below line for single contract deployment
    //truffle migrate -f 3 --network kovan
    // deployer.deploy(RubiconMarket, 22446539696, false, process.env.MAINNET_MULTISIG_RUBICON);

    // TODO: deploy exchange and all of pools in Proxies here and make test changes...
    // deployer.deploy(RubiconMarket).then(function() {
    //     return deployer.deploy(BathHouse, RubiconMarket.address).then(function() {
    //       return deployer.deploy(Strategy, "Stoikov Market Making", BathHouse.address, RubiconMarket.address);
    //     }); 
    // });
};
