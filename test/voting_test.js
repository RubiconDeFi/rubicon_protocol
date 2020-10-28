// NOTE: For BN (Big Number) operations, see https://github.com/indutny/bn.js/

const Migrations = artifacts.require("Migrations");
const RubiconMarket = artifacts.require("RubiconMarket");
const Timelock = artifacts.require("Timelock");
const SenateAlpha = artifacts.require("SenateAlpha");
const RBCN = artifacts.require("RBCN");

let migrationsInstance;
let rubiconMarketInstance;
let timelockInstance;
let senateAlphaInstance;
let RBCNInstance;

function logIndented(...args) {
    console.log("       ", ...args); 
}

contract("Rubicon (Voting Test)", async function(accounts) {

    describe("Deployment", async function() {
        it("is deployed", async function() {
            migrationsInstance = await Migrations.deployed();
            rubiconMarketInstance = await RubiconMarket.deployed();
            timelockInstance = await Timelock.deployed();
            senateAlphaInstance = await SenateAlpha.deployed();
            RBCNInstance = await RBCN.deployed();
        });

        after(function() {
            logIndented("");
            logIndented("*** System Addresses ***");
            logIndented("Account 0: " + accounts[0]);
            logIndented("Migrations: " + migrationsInstance.address);
            logIndented("RubiconMarket: " + rubiconMarketInstance.address);
            logIndented("Timelock: " + timelockInstance.address);
            logIndented("SenateAlpha: " + senateAlphaInstance.address);
            logIndented("RBCN: " + RBCNInstance.address);
            logIndented("************************");
            logIndented("");
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

    describe("Timelock", async function() {
        it("has Migrations contract as admin", async function() {
            assert.equal(await timelockInstance.admin(), migrationsInstance.address);
        });
    });

    describe("Migrations", async function() {
        it("is owned by Account 0", async function() {
            assert.equal(await migrationsInstance.owner(), accounts[0]);
        });

        it("can set AuthScheme, then set Senate as admin of Timelock", async function() {
            await migrationsInstance.setAuthSchemeOfSystem(timelockInstance.address, senateAlphaInstance.address);
            await senateAlphaInstance.__acceptAdmin();
            assert.equal(await timelockInstance.admin(), senateAlphaInstance.address);
        });

        it("can set Timelock as owner of RubiconMarket", async function() {
            await rubiconMarketInstance.setOwner(timelockInstance.address);
            assert.equal(await rubiconMarketInstance.owner(), timelockInstance.address);
        });

    });

    describe("RBCN", async function() {
        it("has a non-zero total supply", async function() {
            logIndented("RBCN Supply:", (await RBCNInstance.totalSupply()).toString());
            assert((await RBCNInstance.totalSupply()).gt(0)); // Greater than zero
        });

        it("has a non-zero RBCN balance for Address 0", async function() {
            logIndented("Balance of Address 0:", (await RBCNInstance.balanceOf(accounts[0])).toString());
            assert((await RBCNInstance.balanceOf(accounts[0])).gt(0)); // Greater than zero
        });
    });

});
