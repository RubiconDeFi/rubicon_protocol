const BathHouse = artifacts.require("BathHouse");
const BathPair = artifacts.require("BathPair");
const BathToken = artifacts.require("BathToken");
const RubiconMarket = artifacts.require("RubiconMarket");
const TokenWithFaucet = artifacts.require("TokenWithFaucet");
const WETH = artifacts.require("WETH9");
const Router = artifacts.require("RubiconRouter");

const helper = require("./testHelpers/timeHelper.js");

function logIndented(...args) {
  console.log("       ", ...args);
}

// ganache-cli --gasLimit=0x1fffffffffffff --gasPrice=0x1 --allowUnlimitedContractSize --defaultBalanceEther 9000
// ganache-cli --gasLimit=9000000 --gasPrice=0x1 --defaultBalanceEther 9000 --allowUnlimitedContractSize

contract("Rubicon Router Test", async function (accounts) {
  let asset1;
  let asset2;
  let asset3;
  let router;
  let DAIInstance;
  let USDCInstance;
  let WETHInstance;

  WETHInstance = await WETH.new();

  describe("Deployment", async function () {
    // Make markets for: WETH / DAI and Target / DAI
    it("Deploy quote tokens for trading", async function () {
      DAIInstance = await TokenWithFaucet.new(
        accounts[0],
        "DAI Stablecoin",
        "DAI",
        18
      );
      USDCInstance = await TokenWithFaucet.new(
        accounts[0],
        "DAI Stablecoin",
        "DAI",
        18
      );
      asset1 = await TokenWithFaucet.new(accounts[0], "Asset1", "ASS", 18);
      asset2 = await TokenWithFaucet.new(accounts[0], "Asset2", "ASS", 18);
      asset3 = await TokenWithFaucet.new(accounts[0], "Asset3", "ASS", 18);
      assert.equal(
        (await USDCInstance.balanceOf(accounts[0])).toString(),
        "1000000000000000000000000"
      );
    });
    it("Router is deployed with correct exchange and WETH address", async function () {
      router = await Router.new();
      await router.startErUp((await RubiconMarket.deployed()).address, WETHInstance.address);
      let g = await router.RubiconMarketAddress();
      assert.equal(g, (await RubiconMarket.deployed()).address);
    });
  });

  describe("Swap Test", async function () {
    // make a thick bid and ask for Asset_1 / DAI

    it("Make Asset_1 / DAI market ", async function () {
      let rubiconMarketInstance = await RubiconMarket.deployed();
      (await asset1).approve(
        rubiconMarketInstance.address,
        web3.utils.toWei((1000).toString()),
        { from: accounts[0] }
      );
      DAIInstance.approve(
        rubiconMarketInstance.address,
        web3.utils.toWei((1000).toString()),
        { from: accounts[0] }
      );
      await DAIInstance.faucet({ from: accounts[0] });
      // asset 1 = 5$ - ask
      await rubiconMarketInstance.offer(
        web3.utils.toWei((1).toString(), "ether"),
        (
          await asset1
        ).address,
        web3.utils.toWei((5).toString(), "ether"),
        DAIInstance.address,
        0,
        { from: accounts[0] }
      );
      // Bid $4 dai
      await rubiconMarketInstance.offer(
        web3.utils.toWei((4).toString(), "ether"),
        DAIInstance.address,
        web3.utils.toWei((1).toString(), "ether"),
        (
          await asset1
        ).address,
        0,
        { from: accounts[0] }
      );
      assert.equal(
        (
          await (await asset1).balanceOf(rubiconMarketInstance.address)
        ).toString(),
        web3.utils.toWei((1).toString(), "ether")
      );
    });

    it("Make Asset_2 / DAI market ", async function () {
      let rubiconMarketInstance = await RubiconMarket.deployed();
      (await asset2).approve(
        rubiconMarketInstance.address,
        web3.utils.toWei((1000).toString()),
        { from: accounts[0] }
      );
      DAIInstance.approve(
        rubiconMarketInstance.address,
        web3.utils.toWei((1000).toString()),
        { from: accounts[0] }
      );
      // await DAIInstance.faucet({ from: accounts[0]});
      // asset 2 = 40$ - ask
      await rubiconMarketInstance.offer(
        web3.utils.toWei((1).toString(), "ether"),
        (
          await asset2
        ).address,
        web3.utils.toWei((40).toString(), "ether"),
        DAIInstance.address,
        0,
        { from: accounts[0] }
      );
      // Bid $30 dai
      await rubiconMarketInstance.offer(
        web3.utils.toWei((30).toString(), "ether"),
        DAIInstance.address,
        web3.utils.toWei((1).toString(), "ether"),
        (
          await asset2
        ).address,
        0,
        { from: accounts[0] }
      );
    });

    it("Try Asset_1 -> Asset_2 swap", async function () {
      await asset1.faucet({ from: accounts[1] });

      (await asset1).approve(
        router.address,
        web3.utils.toWei((1000).toString()),
        { from: accounts[1] }
      );
      // logIndented(web3.utils.fromWei(await (await asset1).balanceOf(accounts[1])));
      // Expected swap rate is 1 asset1 -> 0.1 asset2
      await router.swap(
        web3.utils.toWei((0.5).toString()),
        web3.utils.toWei((0.0499).toString()), // after fees, simply * 1 - 0.2%
        [(await asset1).address, DAIInstance.address, (await asset2).address],
        20,
        { from: accounts[1] }
      );

      assert.equal(
        (await (await asset2).balanceOf(accounts[1])).toString(),
        web3.utils.toWei((0.0499).toString())
      );
    });
    it("getter for expected swap rate works", async function () {
      await asset1.faucet({ from: accounts[2] });

      (await asset1).approve(
        router.address,
        web3.utils.toWei((1000).toString()),
        { from: accounts[2] }
      );

      //want to swap 0.25 of asset 1 but don't know what the rate is
      let expect = await router.getExpectedSwapFill(
        web3.utils.toWei((0.25).toString()),
        web3.utils.toWei((0.02495).toString()), // after fees, simply * 1 - 0.2%
        [(await asset1).address, DAIInstance.address, (await asset2).address],
        20,
        { from: accounts[2] }
      );

      // logIndented("got this expect", web3.utils.fromWei(expect))
      // await router.swap(
      //   web3.utils.toWei((0.25).toString()),
      //   web3.utils.toWei((0.02495).toString()), // after fees, simply * 1 - 0.2%
      //   [(await asset1).address, DAIInstance.address, (await asset2).address],
      //   20,
      //   { from: accounts[2] }
      // );

      // assert.equal(
      //   (await (await asset2).balanceOf(accounts[2])).toString(),
      //   web3.utils.toWei((0.02495).toString())
      // );
      assert.equal(expect.toString(), web3.utils.toWei((0.02495).toString()));
    });
  });
  describe("WETH Function Tests", async function () {
    let rubiconMarketInstance = await RubiconMarket.deployed();

    it("WETH BuyAllAmount - Pay Native ETH", async function() {
      logIndented(WETHInstance.address);
      // await router.WETHbuyAllAmountP(asset1.address, web3.utils.toWei((1).toString()), );
    });
    it("WETH BuyAllAmount - Buy Native ETH", async function() {
      logIndented(WETHInstance.address);
    });
    it("WETH WETHofferP - Offer Native ETH", async function() {
      logIndented(WETHInstance.address);
    });
    it("WETH WETHofferP - Offer asking for Native ETH", async function() {
      // Potential to match and get a fill
      logIndented(WETHInstance.address);
    });
    it("WETH Cancel WETH offer to receive native ETH", async function() {
      // Potential to match and get a fill
      logIndented(WETHInstance.address);
    });
    it("WETH Cancel WETH offer to receive native ETH", async function() {
      // Potential to match and get a fill
      logIndented(WETHInstance.address);
    });
    it("Deposit native ETH into bathETH", async function() {
      // Potential to match and get a fill
      logIndented(WETHInstance.address);
    });
    it("Withdraw native ETH from bathETH pool", async function() {
      // Potential to match and get a fill
      logIndented(WETHInstance.address);
    });
    it("Swap with ETH for an ERC20", async function() {
      // Potential to match and get a fill
      logIndented(WETHInstance.address);
    });
    it("Swap for ETH with an ERC20", async function() {
      // Potential to match and get a fill
      logIndented(WETHInstance.address);
    });
  });
});
