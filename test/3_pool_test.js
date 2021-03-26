const BathHouse = artifacts.require("BathHouse");
const BathPair = artifacts.require("BathPair");
const BathToken = artifacts.require("BathToken");
const RBCN = artifacts.require("RBCN");
const RubiconMarket = artifacts.require("RubiconMarket");
const DAI = artifacts.require("DaiWithFaucet");
const WETH = artifacts.require("WETH9");
const Strategy = artifacts.require("Strategy");

// const { isAssertionExpression, isImportEqualsDeclaration } = require('typescript');
const _deploy_asset_contracts = require('../migrations/2_deploy_asset_contracts.js');
// const { artifacts } = require('hardhat');
const helper = require('./testHelpers/timeHelper.js');

function logIndented(...args) {
    console.log("       ", ...args); 
}

// ganache-cli --gasLimit=0x1fffffffffffff --gasPrice=0x1 --allowUnlimitedContractSize

contract("Rubicon Pools Test", async function(accounts) {
    let newPair;
    let bathPairInstance;
    let bathAssetInstance;
    let bathQuoteInstance;

    describe("Deployment", async function() {
        it("is deployed", async function() {
            rubiconMarketInstance = await RubiconMarket.deployed();
            // RBCNInstance = await RBCN.deployed();
            bathHouseInstance = await BathHouse.deployed();
            DAIInstance = await DAI.deployed();
            WETHInstance = await WETH.deployed();
            // bathTokenInstance = await BathToken.deployed();
        });
    });

    describe("Bath House Initialization of Bath Pair and Bath Tokens", async function() {

        it("Bath House can initialize a new bathToken Pair", async function() {
            // Call initialize on Bath house
            (await bathHouseInstance.initBathPair(WETHInstance.address, "WETH", DAIInstance.address, "DAI"));
            newPair = await bathHouseInstance.getBathPair(WETHInstance.address, DAIInstance.address);
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
        it("bathTokens are auth'd to the pair", async function() {
            assert.equal(await bathPairInstance.address, await bathAssetInstance.pair());
            assert.equal(await bathPairInstance.address, await bathQuoteInstance.pair());
        });
        it("User can deposit asset funds with custom weights and receive bathTokens", async function() {
            await WETHInstance.deposit({from: accounts[1], value: web3.utils.toWei((1).toString())})
            await WETHInstance.approve(bathPairInstance.address, web3.utils.toWei((1).toString()), {from: accounts[1]});
            await bathPairInstance.deposit(WETHInstance.address,  web3.utils.toWei((1).toString()), DAIInstance.address, 0, {from: accounts[1]});
            assert.equal((await bathAssetInstance.balanceOf(accounts[1])).toString(), web3.utils.toWei((1).toString()));            
        });
        it("User can deposit quote funds with custom weights and receive bathTokens", async function() {
            await DAIInstance.faucet({from: accounts[2]});
            await DAIInstance.approve(bathPairInstance.address, web3.utils.toWei((100).toString()), {from: accounts[2]});
            await bathPairInstance.deposit(WETHInstance.address,  0, DAIInstance.address, web3.utils.toWei((100).toString()), {from: accounts[2]});
            assert.equal((await bathQuoteInstance.balanceOf(accounts[2])).toString(), web3.utils.toWei((100).toString()));            
        });
        it("Withdraw asset funds by sending in bathTokens", async function() {
            await bathPairInstance.withdraw(WETHInstance.address,  web3.utils.toWei((1).toString()), DAIInstance.address, 0, {from: accounts[1]});
            assert.equal(await WETHInstance.balanceOf(accounts[1]), web3.utils.toWei((1).toString()));
        });
        it("Withdraw quote funds by sending in bathTokens", async function() {
            await bathPairInstance.withdraw(WETHInstance.address,  0, DAIInstance.address, web3.utils.toWei((100).toString()), {from: accounts[2]});
            assert.equal(await DAIInstance.balanceOf(accounts[2]), web3.utils.toWei((100).toString()));
        });
        it("both users have no bath Tokens post withdraw", async function() {
            assert.equal("0", await bathAssetInstance.balanceOf(accounts[1]));
            assert.equal("0", await bathQuoteInstance.balanceOf(accounts[2]));
        });
    });

    // Test Market making functionality:
    describe("Liquidity Providing Tests", async function() {
        it("User can deposit asset funds with custom weights and receive bathTokens", async function() {
            await WETHInstance.deposit({from: accounts[1], value: web3.utils.toWei((10).toString())})
            await WETHInstance.approve(bathPairInstance.address, web3.utils.toWei((10).toString()), {from: accounts[1]});
            
            await bathPairInstance.deposit(WETHInstance.address,  web3.utils.toWei((10).toString()), DAIInstance.address, 0, {from: accounts[1]});
            assert.equal((await bathAssetInstance.balanceOf(accounts[1])).toString(), web3.utils.toWei((10).toString()));            
        });
        it("Users can deposit quote funds with custom weights and receive bathTokens", async function() {
            await DAIInstance.faucet({from: accounts[2]});
            await DAIInstance.approve(bathPairInstance.address, web3.utils.toWei((100).toString()), {from: accounts[2]});
            
            await bathPairInstance.deposit(WETHInstance.address,  0, DAIInstance.address, web3.utils.toWei((100).toString()), {from: accounts[2]});
            assert.equal((await bathQuoteInstance.balanceOf(accounts[2])).toString(), web3.utils.toWei((100).toString()));            
        });
        it("Place a starting pair to clear checks", async function () {
           
            await WETHInstance.deposit({from: accounts[3],value: web3.utils.toWei((0.5).toString())});
            await WETHInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((0.5).toString()), {from: accounts[3]});
            await rubiconMarketInstance.offer(web3.utils.toWei((0.1).toString(), "ether"), WETHInstance.address, web3.utils.toWei((5).toString(), "ether"), DAIInstance.address, 0, {from: accounts[3]});        
            
            // To trigger faucet again:
            // helper.advanceTimeAndBlock(8700);
            await DAIInstance.faucet({from: accounts[4]});
            await DAIInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((70).toString()), {from: accounts[4]});
            // logIndented(await rubiconMarketInstance.AqueductDistributionLive());
            await rubiconMarketInstance.offer( web3.utils.toWei((4).toString(), "ether"), DAIInstance.address, web3.utils.toWei((0.1).toString(), "ether"), WETHInstance.address,  0, {from: accounts[4], gas: 0x1ffffff });        
        });
        it("Can initialize an approved strategy", async function () {
            // await bathPairInstance.executeStrategy(10);
            // await deployer.deploy(Strategy, {from: accounts[0]});
            strategyInstance = await Strategy.deployed();

            await bathHouseInstance.approveStrategy(strategyInstance.address);
        });
        it("Any user can call executeStrategy() on bath Pairs", async function () {
            // returns 1:
            // logIndented((await rubiconMarketInstance.getOfferCount(WETHInstance.address, DAIInstance.address)).toString());
           
            // is presently just bidding and asking at market rate
            const askNumerator = web3.utils.toWei((0.1).toString()); 
            const askDenominator = web3.utils.toWei((5).toString());
            const bidNumerator = web3.utils.toWei((4).toString());
            const bidDenominator = web3.utils.toWei((0.1).toString());
            await bathPairInstance.executeStrategy(strategyInstance.address, askNumerator, askDenominator, bidNumerator, bidDenominator);
        });
        it("Taker can fill part of trade", async function () {
            // Fill part of the pair trade --> fill the ask
            // logIndented("what is starting", (await WETHInstance.balanceOf(accounts[5])).toString());

            await WETHInstance.deposit({from: accounts[5],value: web3.utils.toWei((.1*1.002).toString())});
            await WETHInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((.1*1.002).toString()), {from: accounts[5]});
            // logIndented("Get Offer:", (await rubiconMarketInstance.getOffer(4)));

            await rubiconMarketInstance.buy(4, web3.utils.toWei((4).toString()), { from: accounts[5] });
            // logIndented("what is left", (await WETHInstance.balanceOf(accounts[5])).toString());
            // logIndented("what is earned", (await DAIInstance.balanceOf(accounts[5])).toString());
        });
        it("Partial fill is correctly cancelled and replaced", async function () {
            // Cancel emmitted and working!
            const askNumerator = web3.utils.toWei((0.1).toString()); 
            const askDenominator = web3.utils.toWei((5).toString());
            const bidNumerator = web3.utils.toWei((4).toString());
            const bidDenominator = web3.utils.toWei((0.1).toString());
            await bathPairInstance.executeStrategy(strategyInstance.address, askNumerator, askDenominator, bidNumerator, bidDenominator);

            // logIndented((await rubiconMarketInstance.getOfferCount(WETHInstance.address, DAIInstance.address)).toString());
            // logIndented((await rubiconMarketInstance.getOfferCount(DAIInstance.address ,WETHInstance.address)).toString());
            // logIndented("anmount bought", web3.utils.toWei((.1).toString()));
        });
        it("Funds are correctly returned to bathTokens", async function () {
            // assert.equal((await WETHInstance.balanceOf(bathQuoteAddress.address)).toString(),"0");
            // assert.equal((await DAIInstance.balanceOf(bathAssetAddress.address)).toString(),"0");
        });
    });
});



// Running list of TO DOs:
//  - dynamic order sizing
