// const BN = require('bn.js');

const RubiconMarket = artifacts.require("RubiconMarket");
const RBCN = artifacts.require("RBCN");
const Aqueduct = artifacts.require("Aqueduct");
const DAI = artifacts.require("DaiWithFaucet");
const WETH = artifacts.require("WETH9");

const helper = require('./testHelpers/timeHelper.js');

function logIndented(...args) {
    console.log("       ", ...args); 
}

const FOUR_YEARS_SECONDS = "126144000";
//store the start time of RBCN distribution on RubiconMarket
var oldTimeofRBCN;

contract("RBCN Public Allocation and Trade Tests", async function(accounts) {
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

    // Check distribution values
    describe("RBCN Distribution", async function() {
        it("has a four-year distribution window", async function() {
            logIndented("Distribution window of RBCN in seconds:", ((await RBCNInstance.distEndTime()) - (await RBCNInstance.distStartTime())).toString());         
            assert.equal(((await RBCNInstance.distEndTime()) - (await RBCNInstance.distStartTime())).toString(), FOUR_YEARS_SECONDS);
        });
        it("has nearly correct per second rate (close enough to millions)", async function() {
            assert.equal(Math.round((((await RBCNInstance.distRate()) / 1e18) * FOUR_YEARS_SECONDS) / 1000000) * 1000000, 510000000);
        });
        it("Aqueduct has right params", async function() {
            await aqueductInstance.setDistributionParams(RBCNInstance.address, rubiconMarketInstance.address);
            assert.equal(await aqueductInstance.RubiconMarketAddress(), rubiconMarketInstance.address);
            assert.equal(await aqueductInstance.RBCNAddress(), RBCNInstance.address);
        });
    });

    // Test a single trade after X amount of seconds that checks if correct amount of RBCN is deployed
    describe("Trade Test", async function() {
        it("Maker can place an offer to sell 0.5 WETH for 50 DAI", async function() {
            await WETHInstance.deposit({from: accounts[3],value: web3.utils.toWei((0.5).toString())});
            await WETHInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((0.5).toString()), {from: accounts[3]});
            await rubiconMarketInstance.offer(web3.utils.toWei((0.5).toString(), "ether"), WETHInstance.address, web3.utils.toWei((50).toString(), "ether"), DAIInstance.address, 1, {from: accounts[3]});        
            const makerTradeID = (await rubiconMarketInstance.getBestOffer(WETHInstance.address,DAIInstance.address)).toString();   
            assert.equal(makerTradeID, '1');
        });
        it("Taker can take the offer while paying the taker fee", async function() {
            await DAIInstance.faucet({from: accounts[4]});
            const timeOfRBCNStart = (await aqueductInstance.timeOfLastRBCNDist());
            oldTimeofRBCN = parseFloat(timeOfRBCNStart.toString());

            // Time increase for testing purposes of distribution
            // await helper.advanceTimeAndBlock(100);

            await DAIInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((55).toString()), {from: accounts[4]});
            const tradeID = (await rubiconMarketInstance.getBestOffer(WETHInstance.address,DAIInstance.address));
            const tradeDetails = (await rubiconMarketInstance.getOffer(tradeID));
            await rubiconMarketInstance.buy(tradeID, tradeDetails[0].toString(), {from: accounts[4]});
        });
        it("RBCN was distributed with the right Maker/Taker ratio", async function() {
            const RBCNAccruedMaker = (await RBCNInstance.balanceOf(accounts[3]));
            const RBCNAccruedTaker = (await RBCNInstance.balanceOf(accounts[4]));
            assert.equal(1.5, (parseFloat(web3.utils.fromWei(RBCNAccruedMaker.toString(), "ether")) / parseFloat(web3.utils.fromWei(RBCNAccruedTaker.toString(), "ether"))).toFixed(1));
        });
        it("RBCN was accrued with the right rate", async function() {
            const RBCNAccruedMaker = (await RBCNInstance.balanceOf(accounts[3])); 
            const expectedMaker = ((await web3.eth.getBlock('latest'))['timestamp'] - oldTimeofRBCN) * 4.0444092 * (3/5);
            assert.equal(expectedMaker.toFixed(3), parseFloat(web3.utils.fromWei(RBCNAccruedMaker.toString(), "ether")).toFixed(3));
        });
        it("Fee was correctly paid to admin account", async function() {
            const feeAmount = web3.utils.toWei((50 * 0.002).toString(), "ether");
            assert.equal(feeAmount.toString(), (await DAIInstance.balanceOf(accounts[0])).toString())
        });
    });

    describe("Test Native ETH Routing Functions", async function() {
        it("Maker can place an offer to sell 0.5 ~Native ETH~ for 50 DAI", async function() {
            await WETHInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((0.5).toString()), {from: accounts[5]});
            await rubiconMarketInstance.offerInETH(web3.utils.toWei((50).toString(), "ether"), DAIInstance.address, {from: accounts[5],value: web3.utils.toWei((0.5).toString())});        
            const makerTradeID = (await rubiconMarketInstance.getBestOffer(WETHInstance.address,DAIInstance.address)).toString();   
            assert.equal(makerTradeID, '2');
        });
        it("Taker can take the offer in DAI while paying the taker fee", async function() {
            await DAIInstance.faucet({from: accounts[6]});
            await DAIInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((55).toString()), {from: accounts[6]});
            const tradeID = (await rubiconMarketInstance.getBestOffer(WETHInstance.address,DAIInstance.address));
            // logIndented("tradeID", tradeID.toString());
            const tradeDetails = (await rubiconMarketInstance.getOffer(tradeID));
            
            // Time increase for testing purposes of distribution
            await helper.advanceTimeAndBlock(100);

            await rubiconMarketInstance.buy(tradeID, tradeDetails[0].toString(), {from: accounts[6]});

            const totalFeesAccrued = web3.utils.toWei((50 * 0.002).toString(), "ether") * 2;
            assert.equal(totalFeesAccrued.toString(), (await DAIInstance.balanceOf(accounts[0])).toString())
        });
        it("Maker can place an offer to sell 50 DAI for 0.5 ~Native ETH~", async function() {
            await DAIInstance.faucet({from: accounts[5]});
            await DAIInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((55).toString()), {from: accounts[5]});
            await rubiconMarketInstance.offer(web3.utils.toWei((50).toString(), "ether"), DAIInstance.address, web3.utils.toWei((0.5).toString(), "ether"), WETHInstance.address, 0, {from: accounts[5]});        
            const makerTradeID = (await rubiconMarketInstance.getBestOffer(DAIInstance.address, WETHInstance.address)).toString();   
            assert.equal(makerTradeID, '3');
        });
        it("Taker can take the offer in ~native ETH~ while paying the taker fee", async function() {
            const tradeID = (await rubiconMarketInstance.getBestOffer(DAIInstance.address, WETHInstance.address));
            // logIndented("tradeID", tradeID.toString());
            const tradeDetails = (await rubiconMarketInstance.getOffer(tradeID));

            await WETHInstance.approve(rubiconMarketInstance.address, web3.utils.toWei((0.5 * 1.002).toString()), {from: accounts[7]});

            // Time increase for testing purposes of distribution
            await helper.advanceTimeAndBlock(100);

            await rubiconMarketInstance.buyInETH(tradeID, {from: accounts[7], value: tradeDetails[0].toString()});

            const WETHfee = web3.utils.toWei((0.5 * 0.002).toString(), "ether");
            assert.equal(parseFloat(WETHfee.toString()).toFixed(3), parseFloat((await WETHInstance.balanceOf(accounts[0])).toString()).toFixed(3));
        });
    });
});