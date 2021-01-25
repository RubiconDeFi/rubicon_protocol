// NOTE: For BN (Big Number) operations, see https://github.com/indutny/bn.js/

// const { artifacts } = require("hardhat");
const BN = require('bn.js');
const BigNumber = require('bignumber.js');
const web3Abi = require('web3-eth-abi');

const Migrations = artifacts.require("Migrations");
const RubiconMarket = artifacts.require("RubiconMarket");
const Timelock = artifacts.require("Timelock");
const SenateAlpha = artifacts.require("SenateAlpha");
const RBCN = artifacts.require("RBCN");
const Aqueduct = artifacts.require("Aqueduct");
const TokenVesting1 = artifacts.require("TokenVesting1");
const TokenVesting2 = artifacts.require("TokenVesting2");

const helper = require('./testHelpers/timeHelper.js');

let migrationsInstance;
let rubiconMarketInstance;
let timelockInstance;
let senateAlphaInstance;
let RBCNInstance;

function logIndented(...args) {
    console.log("       ", ...args); 
}

const EighteenZeros = "000000000000000000"
const Founder1Tokens = "500" + EighteenZeros;
const Founder2Tokens = "500" + EighteenZeros;

contract("Rubicon Migrations and Governance Test", async function(accounts) {

    describe("Deployment", async function() {
        it("is deployed", async function() {
            migrationsInstance = await Migrations.deployed();
            rubiconMarketInstance = await RubiconMarket.deployed();
            timelockInstance = await Timelock.deployed();
            senateAlphaInstance = await SenateAlpha.deployed();
            RBCNInstance = await RBCN.deployed();
            aqueductInstance = await Aqueduct.deployed();
            tokenVesting1Instance = await TokenVesting1.deployed();
            tokenVesting2Instance = await TokenVesting2.deployed();
        });

        after(function() {
            logIndented("");
            logIndented("*** System Addresses ***");
            logIndented("Account 0: " + accounts[0]);
            logIndented("Account 1: " + accounts[1]);
            logIndented("Account 2: " + accounts[2]);
            logIndented("Migrations: " + migrationsInstance.address);
            logIndented("RubiconMarket: " + rubiconMarketInstance.address);
            logIndented("Timelock: " + timelockInstance.address);
            logIndented("SenateAlpha: " + senateAlphaInstance.address);
            logIndented("RBCN: " + RBCNInstance.address);
            logIndented("************************");
            logIndented("");
        });
    });
    
    describe("RBCN", async function() {
        it("has a total supply equal to 1 billion tokens", async function() {
            logIndented("RBCN Supply:", (await RBCNInstance.totalSupply()).toString());
            assert.equal((await RBCNInstance.totalSupply()).toString(), "1000000000000000000000000000");
        });

        it("Admin has 49% of Total Supply ", async function() {
            logIndented("Balance of Address 0:", (await RBCNInstance.balanceOf(accounts[0])).toString());
            assert.equal((await RBCNInstance.balanceOf(accounts[0])).toString(), "490000000000000000000000000"); // Greater than zero
        });

        it("Aqueduct has 51% of Total Supply ", async function() {
            logIndented("Balance of Aqueduct:", (await RBCNInstance.balanceOf(aqueductInstance.address)).toString());
            assert.equal((await RBCNInstance.balanceOf(aqueductInstance.address)).toString(), "510000000000000000000000000");
        });
    });

    describe("Timelock", async function() {
        it("has Migrations contract as admin", async function() {
            assert.equal(await timelockInstance.admin(), migrationsInstance.address);
        });
    });

    describe("RubiconMarket", async function() {
        it("has a market 'close time' in the future", async function() {
            const close_time = await rubiconMarketInstance.close_time();
            const curr_time = Math.floor(Date.now() / 1000);
            // Using .toNumber on BN (big number) is safe here, since Unix time will be lower than MAX_SAFE_INTEGER
            assert.isAbove(close_time.toNumber(), curr_time);
        });
    });

    describe("Senate", async function() {
        it("has Timelock loaded in correctly", async function() {
            assert.equal(await senateAlphaInstance.timelock(), timelockInstance.address);
        });
        it("has correct RBCN address", async function() {
            assert.equal(await senateAlphaInstance.RBCN(), RBCNInstance.address);
        });
        it("has Internal Admin as inital gaurdian", async function() {
            assert.equal(await senateAlphaInstance.guardian(), accounts[0]);
        });
    });

    describe("Migrations", async function() {
        it("Migrations contract is owned by Account 0", async function() {
            assert.equal(await migrationsInstance.owner(), accounts[0]);
        });

        it("can set AuthScheme, then set Senate as admin of Timelock", async function() {
            await migrationsInstance.setAuthSchemeOfSystem(timelockInstance.address, senateAlphaInstance.address);
            await senateAlphaInstance.__acceptAdmin();
            assert.equal(await timelockInstance.admin(), senateAlphaInstance.address);
        });

        it("can set Aqueduct Address on Market", async function() {
            await rubiconMarketInstance.setAqueductAddress(aqueductInstance.address);
            assert.equal(await rubiconMarketInstance.AqueductAddress(), aqueductInstance.address);
        });

        it("can set RBCN Dist live on Market", async function() {
            await rubiconMarketInstance.setAqueductDistributionLive(true);
            assert.equal(await rubiconMarketInstance.AqueductDistributionLive(), true);
        });

        // The order of this is important!

        it("can set Timelock as owner of RubiconMarket", async function() {
            await rubiconMarketInstance.setOwner(timelockInstance.address);
            assert.equal(await rubiconMarketInstance.owner(), timelockInstance.address);
        });

        it("Internal admin can abdicate from Senate", async function() {
            await senateAlphaInstance.__abdicate();
            assert.equal(await senateAlphaInstance.guardian(), "0x0000000000000000000000000000000000000000");
        });

        
        it("can set distribution params on Aqueduct", async function() {
            await aqueductInstance.setDistributionParams(RBCNInstance.address, rubiconMarketInstance.address);
            assert.equal(await aqueductInstance.RubiconMarketAddress(), rubiconMarketInstance.address);
            assert.equal(await aqueductInstance.RBCNAddress(), RBCNInstance.address);
        });

    });

    describe("Timelock and Rubicon Market Admin Check", async function() {
        it("Timelock has admin as Senate", async function() {
            assert.equal(await timelockInstance.admin(), senateAlphaInstance.address);
        });
    });
    
    describe('Token Vesting', () => {
        it("founder 1 is beneficiary of token vesting contract 1", async function() {
            assert.equal(await tokenVesting1Instance.beneficiary(), accounts[1]);
        });
        it("admin can lock founder 1's tokens into vesting contract", async function () {
            await RBCNInstance.transfer(tokenVesting1Instance.address, Founder1Tokens);
            assert.equal((await RBCNInstance.balanceOf(tokenVesting1Instance.address)).toString(), Founder1Tokens);
        });
        it("founder 2 is beneficiary of token vesting contract 2", async function() {
            assert.equal(await tokenVesting2Instance.beneficiary(), accounts[2]);
        });
        it("admin can lock founder 2's tokens into vesting contract", async function () {
            await RBCNInstance.transfer(tokenVesting2Instance.address, Founder2Tokens);
            assert.equal((await RBCNInstance.balanceOf(tokenVesting2Instance.address)).toString(), Founder2Tokens);
        });
    });

    // describe('Vote to change "stop" parameter on exchange', () => {
    //     it("starting value of 'stopped' is false", async function() {
    //         assert.equal(await rubiconMarketInstance.stopped(), false);
    //     });
    //     it("can distribute RBCN to two different voters", async function() {
    //         await RBCNInstance.transfer(accounts[4].toString(), web3.utils.toWei((5000001).toString(), "ether"), {from: accounts[0]});
    //         await RBCNInstance.transfer(accounts[5].toString(), web3.utils.toWei((5000001).toString(), "ether"), {from: accounts[0]});
    //         assert.equal(await RBCNInstance.balanceOf(accounts[4].toString()), web3.utils.toWei((5000001).toString(), "ether"));
    //         assert.equal(await RBCNInstance.balanceOf(accounts[5].toString()), web3.utils.toWei((5000001).toString(), "ether"));
    //     });
    //     it("can delegate votes to account so can propose", async function() {

    //     });
    //     it("one RBCN holder can make a proposal to change parameter", async function() {
    //         await helper.advanceTimeAndBlock(1);
    //         console.log('current votes', (await RBCNInstance.getCurrentVotes(accounts[4])).toString());
    //         await senateAlphaInstance.propose([rubiconMarketInstance.address], [], [web3.eth.abi.encodeFunctionSignature('stop()')], [],
    //         "Proposal to stop the Rubicon Market", {from: accounts[4]});
    //         const stopProposalID = await senateAlphaInstance.latestProposalIds(accounts[4].toString());
    //         logIndented(stopProposalID);
    //         assert.equal(await senateAlphaInstance.latestProposalIds(accounts[4].toString()), 1);
    //     });
    //     it("Voters can vote on parameter", async function() {
    //         await senateAlphaInstance.castVote(stopProposalID, true, {from: accounts[5]});
    //         console.log(await senateAlphaInstance.getReceipt(stopProposalID, accounts[5].toString()));
    //         // assert.equal(await senateAlphaInstance.getReceipt(stopProposalID, accounts[5].toString()))
    //     });
    //     it("holders of RBCN can successfully queue the proposal", async function() {
    //         await senateAlphaInstance.queue(stopProposalID);
    //         await helper.advanceTimeAndBlock(28800 * 17);
    //         await timelockInstance.execute(stopProposalID);

    //     });
    //     it("Vote can pass and parameter is successfully changed", async function() {
    //         // await helper.advanceTimeAndBlock(); // Speed up the block time to allow for Timelock execution
    //         assert.equal(await rubiconMarketInstance.stopped(), true);
    //     });
    // });

});
