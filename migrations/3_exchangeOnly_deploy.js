var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");

module.exports = function(deployer, network, accounts) {
    var admin = "0x75E7aBED3406df8f2fD4E036Cbb5f6830bce525d";

    //Toggle below line for single contract deployment
    //truffle migrate -f 3 --network kovan
    // deployer.deploy(RubiconMarket, 14210121600, false, admin, "0x772c16c1dD9cC51fe601B6bA8c8B2feF074528f1");
};
