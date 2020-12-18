const BN = require('bn.js');

const RubiconMarket = artifacts.require("RubiconMarket");
const RBCN = artifacts.require("RBCN");
const Aqueduct = artifacts.require("Aqueduct");
const DAI = artifacts.require("DaiWithFaucet");
const WETH = artifacts.require("WETH9");

const helper = require('../testHelpers/timeHelper.js');

function logIndented(...args) {
    console.log("       ", ...args); 
}

const FOUR_YEARS_SECONDS = "126144000";

contract("RBCN Public Allocations Test", async function(accounts) {
    describe("Deployment", async function() {
        it("is deployed", async function() {
            rubiconMarketInstance = await RubiconMarket.deployed();
            RBCNInstance = await RBCN.deployed();
            aqueductInstance = await Aqueduct.deployed();
            DAIInstance = await DAI.deployed();
            WETHInstance = await WETH.deployed();
        });

        after(function() {
            logIndented("");
            logIndented("*** System Addresses ***");
            logIndented("Admin / Account 0: " + accounts[0]);
            logIndented("Trader 1 / Maker / Account 3: " + accounts[3]);
            logIndented("Trader 2 / Taker / Account 4: " + accounts[4]);
            logIndented("Aqueduct: " + aqueductInstance.address);
            logIndented("RubiconMarket: " + rubiconMarketInstance.address);
            logIndented("RBCN: " + RBCNInstance.address);
            logIndented("DAI: " + DAIInstance.address);
            logIndented("WETH: " + WETHInstance.address);
            logIndented("************************");
            logIndented("");
        });
    });

    // Check distribution values and log them
    describe("RBCN Distribution", async function() {
        it("has a four-year distribution window", async function() {
            logIndented("Distribution window of RBCN", ((await RBCNInstance.distEndTime()) - (await RBCNInstance.distStartTime())).toString());
            assert.equal(((await RBCNInstance.distEndTime()) - (await RBCNInstance.distStartTime())).toString(), FOUR_YEARS_SECONDS);
        });
        it("has nearly correct per second rate (close enough to millions)", async function() {
            assert.equal(Math.round((((await RBCNInstance.distRate()) / 1e18) * FOUR_YEARS_SECONDS) / 1000000) * 1000000, 510000000);
        });
    });


    // Test a single trade after X amount of seconds that checks if correct amount of RBCN is deployed
    describe("Trade Test", async function() {
        it("Maker can place an offer to sell 50 DAI for 0.5 WETH", async function() {
            await WETHInstance.deposit({from: accounts[3],value: web3.utils.toWei((0.5).toString())});
            // console.log("balance check", (await WETHInstance.balanceOf(accounts[3])).toString());
            await WETHInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((0.5).toString()), {from: accounts[3]});
            await rubiconMarketInstance.offer(web3.utils.toWei((0.5).toString(), "ether"), WETHInstance.address, web3.utils.toWei((50).toString(), "ether"), DAIInstance.address, 1, {from: accounts[3]});        
            await rubiconMarketInstance.getBestOffer(WETHInstance.address,DAIInstance.address).toString();
            // assert.equal(makerTradeID., 1);
        });
        it("Aqueduct has right params", async function() {
            await aqueductInstance.setDistributionParams(RBCNInstance.address, rubiconMarketInstance.address);
            assert.equal(await aqueductInstance.RubiconMarketAddress(), rubiconMarketInstance.address);
            assert.equal(await aqueductInstance.RBCNAddress(), RBCNInstance.address);
        });
        it("Taker can take the offer while paying the taker fee", async function() {
            await DAIInstance.faucet({from: accounts[4]});
            await DAIInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((55).toString()), {from: accounts[4]});
            const tradeID = (await rubiconMarketInstance.getBestOffer(WETHInstance.address,DAIInstance.address));
            const tradeDetails = (await rubiconMarketInstance.getOffer(tradeID));
            // // console.log("tradeID", tradeID.toString());
            // console.log("tradeDetails", tradeDetails[0].toString());
            // console.log("address", (await aqueductInstance.RubiconMarketAddress()));
            await helper.advanceTimeAndBlock(100);
            await rubiconMarketInstance.buy(tradeID, tradeDetails[0].toString(), {from: accounts[4]});
        });
        it("RBCN was correctly accrued", async function() {
            const RBCNAccruedMaker = (await RBCNInstance.balanceOf(accounts[3]));
            // console.log("RBCNAccrued Maker", RBCNAccruedMaker.toString());
            const RBCNAccruedTaker = (await RBCNInstance.balanceOf(accounts[4]));
            assert(RBCNAccruedMaker.gt(0));
            assert(RBCNAccruedTaker.gt(0));
        });
        it("Fee was correctly paid to admin account", async function() {
            const feeAmount = web3.utils.toWei((50 * 0.002).toString(), "ether");
            console.log("fee anoiuybt", feeAmount);
            assert.equal(feeAmount.toString(), (await DAIInstance.balanceOf(accounts[0])).toString())
        });
    });
});