const BathHouse = artifacts.require("BathHouse");
const BathPair = artifacts.require("BathPair");
const BathToken = artifacts.require("BathToken");
const RBCN = artifacts.require("RBCN");
const RubiconMarket = artifacts.require("RubiconMarket");
const DAI = artifacts.require("DaiWithFaucet");
const WETH = artifacts.require("WETH9");
const PairsTrade = artifacts.require("PairsTrade");

// const { isAssertionExpression, isImportEqualsDeclaration } = require('typescript');
const _deploy_asset_contracts = require('../migrations/2_deploy_asset_contracts.js');
// const { artifacts } = require('hardhat');
const helper = require('./testHelpers/timeHelper.js');

function logIndented(...args) {
    console.log("       ", ...args); 
}

// ganache-cli --gasLimit=0x1fffffffffffff --gasPrice=0x1 --allowUnlimitedContractSize --defaultBalanceEther 9000
// ganache-cli --gasLimit=9000000 --gasPrice=0x1 --defaultBalanceEther 9000 --allowUnlimitedContractSize

contract("Rubicon Pools Test", async function(accounts) {
    let newPair;
    let bathPairInstance;
    let bathAssetInstance;
    let bathQuoteInstance;

    describe("Deployment", async function() {
        it("is deployed", async function() {
            rubiconMarketInstance = await RubiconMarket.deployed();
            bathHouseInstance = await BathHouse.deployed();
            DAIInstance = await DAI.deployed();
            WETHInstance = await WETH.deployed();
            bathPairInstance = await BathPair.deployed();
        });
    });

    describe("Bath House Initialization of Bath Pair and Bath Tokens", async function() {

        it("Bath House is deployed and initialized", async function() {
            // Call initialize on Bath house
            return await bathHouseInstance.initialize(rubiconMarketInstance.address, 80, 5, 10);

        });
        it("Bath Token for asset is deployed and initialized", async function() {
            return await BathToken.new().then(async function(instance) {
                await instance.initialize("bathWETH", WETHInstance.address, rubiconMarketInstance.address, bathHouseInstance.address);
                bathAssetInstance = await instance;
            });
        });
        it("Bath Token for quote is deployed and initialized", async function() {
            return await BathToken.new().then(async function(instance) {
                await instance.initialize("bathDAI", DAIInstance.address, rubiconMarketInstance.address, bathHouseInstance.address);
                bathQuoteInstance = await instance;
                console.log("new bathDAI addr", bathQuoteInstance.address);
            })
        });
        it("Bath Pair is deployed and initialized w/ BathHouse", async function() {
            await bathPairInstance.initialize(bathAssetInstance.address, bathQuoteInstance.address, bathHouseInstance.address);

            (await bathHouseInstance.initBathPair(WETHInstance.address, DAIInstance.address, bathPairInstance.address, 5)); // 90% reserve ratio and 3 days cancel delay
            newPair = await bathHouseInstance.getBathPair(WETHInstance.address, DAIInstance.address);
            logIndented("New BathPair: ", newPair);
        });
        it("can correctly spawn bathWETH and bathDAI", async function() {
            // bathPairInstance = await BathPair.at(newPair);
            bathAssetAddress = await bathPairInstance.bathAssetAddress();
            logIndented("bathWETH address: ", bathAssetAddress);
            bathQuoteAddress = await bathPairInstance.bathQuoteAddress();
            logIndented("bathDAI address: ", bathQuoteAddress);

            // bathAssetInstance = await BathToken.at(bathAssetAddress);
            // bathQuoteInstance = await BathToken.at(bathQuoteAddress);

            assert.equal(await bathPairInstance.bathAssetAddress(), bathAssetInstance.address);
            assert.equal(await bathPairInstance.bathQuoteAddress(), bathQuoteInstance.address);
        });
        it("bath tokens have the right name", async function() {
            assert.equal(await bathAssetInstance.symbol(), "bathWETH");
            assert.equal(await bathQuoteInstance.symbol(), "bathDAI");
        });
        it("User can deposit asset funds with custom weights and receive bathTokens", async function() {
            await WETHInstance.deposit({from: accounts[1], value: web3.utils.toWei((1).toString())})
            await WETHInstance.approve(bathAssetInstance.address, web3.utils.toWei((1).toString()), {from: accounts[1]});
            await bathAssetInstance.deposit(web3.utils.toWei((1).toString()), {from: accounts[1]});
            assert.equal((await bathAssetInstance.balanceOf(accounts[1])).toString(), web3.utils.toWei((1).toString()));            
        });
        it("User can deposit quote funds with custom weights and receive bathTokens", async function() {
            await DAIInstance.faucet({from: accounts[2]});
            await DAIInstance.approve(bathQuoteInstance.address, web3.utils.toWei((100).toString()), {from: accounts[2]});
            await bathQuoteInstance.deposit(web3.utils.toWei((100).toString()), {from: accounts[2]});
            assert.equal((await bathQuoteInstance.balanceOf(accounts[2])).toString(), web3.utils.toWei((100).toString()));            
        });
        it("Withdraw asset funds by sending in bathTokens", async function() {
            await bathAssetInstance.withdraw(web3.utils.toWei((1).toString()), {from: accounts[1]});
            assert.equal(await WETHInstance.balanceOf(accounts[1]), web3.utils.toWei((1).toString()));
        });
        it("Withdraw quote funds by sending in bathTokens", async function() {
            await bathQuoteInstance.withdraw(web3.utils.toWei((100).toString()), {from: accounts[2]});
            assert.equal(await DAIInstance.balanceOf(accounts[2]), web3.utils.toWei((100).toString()));
        });
        it("both users have no bath Tokens post withdraw", async function() {
            assert.equal("0", await bathAssetInstance.balanceOf(accounts[1]));
            assert.equal("0", await bathQuoteInstance.balanceOf(accounts[2]));
        });
    });

    // Test Market making functionality:
    describe("Liquidity Providing Tests", async function() {
        // Bid and ask made by Pools throughout the test
        const askNumerator = web3.utils.toWei((0.01).toString()); 
        const askDenominator = web3.utils.toWei((0.5).toString());
        const bidNumerator = web3.utils.toWei((0.4).toString());
        const bidDenominator = web3.utils.toWei((0.01).toString());

        it("User can deposit asset funds with custom weights and receive bathTokens", async function() {
            await WETHInstance.deposit({from: accounts[1], value: web3.utils.toWei((10).toString())})
            await WETHInstance.approve(bathAssetInstance.address, web3.utils.toWei((10).toString()), {from: accounts[1]});
            
            await bathAssetInstance.deposit(web3.utils.toWei((10).toString()), {from: accounts[1]});
            assert.equal((await bathAssetInstance.balanceOf(accounts[1])).toString(), web3.utils.toWei((10).toString()));            
        });
        it("Users can deposit quote funds with custom weights and receive bathTokens", async function() {
            await DAIInstance.faucet({from: accounts[2]});
            await DAIInstance.approve(bathQuoteInstance.address, web3.utils.toWei((100).toString()), {from: accounts[2]});
            
            await bathQuoteInstance.deposit(web3.utils.toWei((100).toString()), {from: accounts[2]});
            assert.equal((await bathQuoteInstance.balanceOf(accounts[2])).toString(), web3.utils.toWei((100).toString()));            
        });
        it("Admin can initialize and whitelist WETH and DAI for trading", async function() {
            // await rubiconMarketInstance.initialize(false, accounts[0]);
            await rubiconMarketInstance.addToWhitelist(WETHInstance.address);
            await rubiconMarketInstance.addToWhitelist(DAIInstance.address);
        });
        it("Place a starting pair to clear checks", async function () {
            await WETHInstance.deposit({from: accounts[3],value: web3.utils.toWei((0.5).toString())});
            await WETHInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((0.5).toString()), {from: accounts[3]});
            await rubiconMarketInstance.offer(web3.utils.toWei((0.1).toString(), "ether"), WETHInstance.address, web3.utils.toWei((5).toString(), "ether"), DAIInstance.address, 0, {from: accounts[3]});        
            
            // To trigger faucet again:
            // helper.advanceTimeAndBlock(8700);
            await DAIInstance.faucet({from: accounts[4]});
            await DAIInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((70).toString()), {from: accounts[4]});
            await rubiconMarketInstance.offer( web3.utils.toWei((4).toString(), "ether"), DAIInstance.address, web3.utils.toWei((0.1).toString(), "ether"), WETHInstance.address,  0, {from: accounts[4], gas: 0x1ffffff });        
        });
        it("Can initialize an approved strategy", async function () {
            strategyInstance = await PairsTrade.deployed();

            await bathHouseInstance.approveStrategy(strategyInstance.address);
        });
        it("Any user can call executeStrategy() on bath Pairs", async function () {
            await bathPairInstance.executeStrategy(strategyInstance.address, askNumerator, askDenominator, bidNumerator, bidDenominator);
        });
        it("Taker can fill part of trade", async function () {
            await WETHInstance.deposit({from: accounts[5],value: web3.utils.toWei((100).toString())});
            await WETHInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((100).toString()), {from: accounts[5]});

            await rubiconMarketInstance.buy(4, web3.utils.toWei((0.4).toString()), { from: accounts[5] });
        });
        it("Partial fill is correctly cancelled and replaced", async function () {
            await bathPairInstance.bathScrub();
            
            await bathPairInstance.executeStrategy(strategyInstance.address, askNumerator, askDenominator, bidNumerator, bidDenominator);
        });
        for (let i = 1; i < 20; i++) {
            it(`Spamming of executeStrategy iteration: ${i}`, async function () {
                await rubiconMarketInstance.buy(4 + (i*2), web3.utils.toWei((0.4).toString()), { from: accounts[5] });
                // console.log(await bathPairInstance.executeStrategy.estimateGas(strategyInstance.address, askNumerator, askDenominator, bidNumerator, bidDenominator));
                await bathPairInstance.executeStrategy(strategyInstance.address, askNumerator, askDenominator, bidNumerator, bidDenominator);
                // console.log("IDs of new trades: ",  await bathPairInstance.getLastTradeIDs());
                if (i % 3) {
                    await bathPairInstance.bathScrub();
                }
                // console.log("outstanding pairs: ", await bathPairInstance.getOutstandingPairCount());
            });
        }
        it("Funds are correctly returned to bathTokens", async function () {
            assert.equal((await WETHInstance.balanceOf(bathQuoteInstance.address)).toString(),"0");
            assert.equal((await DAIInstance.balanceOf(bathAssetInstance.address)).toString(),"0");
        });
        it("Strategist can claim funds", async function () {
            (await bathPairInstance.strategistBootyClaim());
            // TODO: validate this is correct
            assert.equal((await WETHInstance.balanceOf(accounts[0])).toString(), "160000000000000");
        });
    });
});