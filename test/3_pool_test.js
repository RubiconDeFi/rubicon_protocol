const BathHouse = artifacts.require("BathHouse");
const BathToken = artifacts.require("BathToken");
const RBCN = artifacts.require("RBCN");
const RubiconMarket = artifacts.require("RubiconMarket");

const helper = require('./testHelpers/timeHelper.js');

function logIndented(...args) {
    console.log("       ", ...args); 
}

// ganache-cli --gasLimit=0x1fffffffffffff --gasPrice=0x1 --allowUnlimitedContractSize

contract("Rubicon Pools Test", async function(accounts) {
    describe("Deployment", async function() {
        it("is deployed", async function() {
            rubiconMarketInstance = await RubiconMarket.deployed();
            RBCNInstance = await RBCN.deployed();
            bathHouseInstance = await BathHouse.deployed();
            bathTokenInstance = await BathToken.deployed();
            
        });
    });
});

