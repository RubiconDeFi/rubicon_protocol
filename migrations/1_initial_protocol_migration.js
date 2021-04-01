var Migrations = artifacts.require("./contracts/Migrations.sol");
var SenateAlpha = artifacts.require("./contracts/SenateAlpha.sol");
var Timelock = artifacts.require("./contracts/Timelock.sol");
var RubiconMarket = artifacts.require("./contracts/RubiconMarket.sol");
var RBCN = artifacts.require("./contracts/RBCN.sol");
var Aqueduct = artifacts.require("./contracts/Aqueduct.sol");
var TokenVesting1 = artifacts.require("./contracts/peripheral_contracts/TokenVesting1");
var TokenVesting2 = artifacts.require("./contracts/peripheral_contracts/TokenVesting2");
var Strategy = artifacts.require("./contracts/Strategy.sol");

var BathHouse = artifacts.require("./contracts/rubiconPoolsv0/BathHouse.sol");

const FOUR_YEARS = 126144000; // four years in unix time

module.exports = function(deployer, network, accounts) {
  
  // Testing Rubicon Pools with following CLI Input: truffle test ./test/3_pool_test.js --network pools
  // *** Pools Migration for Testing Purposes ***
  if (network == "pools") {
    return;
  }
  
  // Full Protocol Migration:
  var admin = accounts[0];
  const Founder1 = accounts[1];
  const Founder2 = accounts[2]; 

  deployer.deploy(TokenVesting1, Founder1, Date.now(), 0, FOUR_YEARS, true); // beneficiary, start, cliffDuration, duration, revocable
  deployer.deploy(TokenVesting2, Founder2, Date.now(), 0, FOUR_YEARS, true); // beneficiary, start, cliffDuration, duration, revocable

  deployer.deploy(Migrations).then(function() {
    return deployer.deploy(Aqueduct, FOUR_YEARS, admin).then(function() {
    return deployer.deploy(RBCN, Aqueduct.address, admin).then(function() {
      return deployer.deploy(Timelock, Migrations.address, 0).then(function(){   // Takes admin and initial delay that must exceed the minimum delay... ZERO FOR TESTING NOT PRODUCTION READY
        //Give admin token balance and set total supply
        return deployer.deploy(SenateAlpha, Timelock.address, RBCN.address, admin).then(function(){ //gaurdian of senate is admin
          // Rubicon Market can be deployed independently of Gov/Token system
          return deployer.deploy(RubiconMarket); //, /* Testing only */ WETH.address);
        });
      });
    });
  });
});
  // await RubiconMarket.initia
};
