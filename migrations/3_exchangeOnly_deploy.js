require('dotenv').config();
var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");

module.exports = function(deployer, network, accounts) {

    //Toggle below line for single contract deployment
    //truffle migrate -f 3 --network kovan
    // deployer.deploy(RubiconMarket, 22446539696, false, process.env.MAINNET_MULTISIG_RUBICON);
};
