const BN = require('bn.js');

const RubiconMarket = artifacts.require("RubiconMarket");
const RBCN = artifacts.require("RBCN");
const Aqueduct = artifacts.require("Aqueduct");
const DAI = artifacts.require("DaiWithFaucet");
const WETH = artifacts.require("WETH9");


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
            logIndented("Migrations: " + aqueductInstance.address);
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
            const makerTradeID = await rubiconMarketInstance.offer(web3.utils.toWei((0.5).toString(), "ether"), WETHInstance.address, web3.utils.toWei((50).toString(), "ether"), DAIInstance.address, {from: accounts[3]});        
            assert.equal(makerTradeID, 1);
        });
        it("Taker can take the offer while paying the taker fee", async function() {
            await DAIInstance.faucet.call({from: accounts[4]});
            await DAIInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((55).toString()));
            await rubiconMarketInstance.buy(makerTradeID, web3.utils.toWei((0.5).toString(), "ether")).call({from: accounts[4]});

        });
        it("RBCN was correctly accrued", async function() {
            const RBCNAccruedMaker = RBCNInstance.balanceOf(accounts[3]);
            const RBCNAccruedTaker = RBCNInstance.balanceOf(accounts[4]);
            assert.equal(RBCNAccruedMaker + RBCNAccruedTaker, )
        });
    });
});