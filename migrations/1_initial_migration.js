var Migrations = artifacts.require("./contracts/Migrations.sol");
var SenateAlpha = artifacts.require("./contracts/SenateAlpha.sol");
var Timelock = artifacts.require("./contracts/Timelock.sol");
var RBCN = artifacts.require("./contracts/RBCN.sol");

module.exports = function(deployer, network, accounts) {
  var admin = accounts[0];
  //var admin = "0xAEda61154aaF841250f3e0A6bb0dc12696549747";
  

  // deployer.deploy(Migrations).then(function() {
  // return deployer.deploy(Timelock, Migrations.address, 0).then(function(){   // Takes admin and initial delay that must exceed the minimum delay... ZERO FOR TESTING NOT PRODUCTION READY
  //   //Give admin token balance and set total supply
  //   return deployer.deploy(SenateAlpha, Timelock.address, RBCN.address, admin); //gaurdian of senate is admin
  // });
  // });

  deployer.deploy(Migrations).then(function() {
    return deployer.deploy(RBCN, admin).then(function() {
    return deployer.deploy(Timelock, Migrations.address, 0).then(function(){   // Takes admin and initial delay that must exceed the minimum delay... ZERO FOR TESTING NOT PRODUCTION READY
      //Give admin token balance and set total supply
      return deployer.deploy(SenateAlpha, Timelock.address, RBCN.address, admin); //gaurdian of senate is admin
    });
    });
  });
  //Timelock admin should be SenateAlpha... first action taken by Senate should be to make itself admin of Timelock.. better way to do this??
  // deployer.deploy(Timelock, Migrations.address, 0).then(function(){   // Takes admin and initial delay that must exceed the minimum delay... ZERO FOR TESTING NOT PRODUCTION READY
  //   //Give admin token balance and set total supply
  //   return deployer.deploy(SenateAlpha, Timelock.address, RBCN.address, admin); //gaurdian of senate is admin
  // });
};
