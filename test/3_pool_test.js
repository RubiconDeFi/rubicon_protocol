const BathHouse = artifacts.require("BathHouse");
const BathPair = artifacts.require("BathPair");
const RBCN = artifacts.require("RBCN");
const RubiconMarket = artifacts.require("RubiconMarket");
const DAI = artifacts.require("DaiWithFaucet");
const WETH = artifacts.require("WETH9");

const { isAssertionExpression } = require('typescript');
// const { artifacts } = require('hardhat');
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
            assetInstance = await DAI.deployed();
            quoteInstance = await WETH.deployed();
            // bathTokenInstance = await BathToken.deployed();
        });
    });

    describe("Bath House Initialization of Bath Tokens", async function() {
        it("Bath House can initialize a new bathToken Pair", async function() {
            // Call initialize on Bath house
            (await bathHouseInstance.initBathPair(assetInstance.address, quoteInstance.address));
            const newPair = await bathHouseInstance.getBathPair(assetInstance.address, quoteInstance.address);
            logIndented("New BathPair: ", newPair);
            //Check that new token exists...
            // BathToken.
            // assert.equal(newPair, )
        });
    });
});

