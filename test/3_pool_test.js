const BathHouse = artifacts.require("BathHouse");
const BathPair = artifacts.require("BathPair");
const BathToken = artifacts.require("BathToken");
const RBCN = artifacts.require("RBCN");
const RubiconMarket = artifacts.require("RubiconMarket");
const DAI = artifacts.require("DaiWithFaucet");
const WETH = artifacts.require("WETH9");

const { isAssertionExpression, isImportEqualsDeclaration } = require('typescript');
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
        let newPair;
        let bathPairInstance;
        let bathAssetInstance;
        let bathQuoteInstance;
        it("Bath House can initialize a new bathToken Pair", async function() {
            // Call initialize on Bath house
            (await bathHouseInstance.initBathPair(assetInstance.address, "WETH", quoteInstance.address, "DAI"));
            newPair = await bathHouseInstance.getBathPair(assetInstance.address, quoteInstance.address);
            logIndented("New BathPair: ", newPair);
        });
        it("can correctly spawn bathWETH and bathDAI", async function() {
            bathPairInstance = await BathPair.at(newPair);
            bathAssetAddress = await bathPairInstance.bathAssetAddress();
            logIndented("bathWETH address: ", bathAssetAddress);
            bathQuoteAddress = await bathPairInstance.bathQuoteAddress();
            logIndented("bathDAI address: ", bathQuoteAddress);

            bathAssetInstance = await BathToken.at(bathAssetAddress);
            bathQuoteInstance = await BathToken.at(bathQuoteAddress);

            assert.equal(await bathPairInstance.bathAssetAddress(), bathAssetInstance.address);
            assert.equal(await bathPairInstance.bathQuoteAddress(), bathQuoteInstance.address);

            // logIndented("asset bath token: ", await BathPair.at(newPair).then((contract) => contract.bathAssetAddress()));
        });
        it("bath tokens have the right name", async function() {
            assert.equal(await bathAssetInstance.symbol(), "bathWETH");
            assert.equal(await bathQuoteInstance.symbol(), "bathDAI");

        });
    });
});

