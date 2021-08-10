const BathHouse = artifacts.require("BathHouse");
const BathPair = artifacts.require("BathPair");
const BathToken = artifacts.require("BathToken");
const RubiconMarket = artifacts.require("RubiconMarket");
const DAI = artifacts.require("USDCWithFaucet");
const WETH = artifacts.require("WETH9");
const BidAskUtil = artifacts.require("BidAskUtil");

const helper = require("./testHelpers/timeHelper.js");

function logIndented(...args) {
  console.log("       ", ...args);
}

// ganache-cli --gasLimit=0x1fffffffffffff --gasPrice=0x1 --allowUnlimitedContractSize --defaultBalanceEther 9000
// ganache-cli --gasLimit=9000000 --gasPrice=0x1 --defaultBalanceEther 9000 --allowUnlimitedContractSize

contract("Rubicon Exchange and Pools Test", async function (accounts) {
  let newPair;
  let bathPairInstance;
  let bathAssetInstance;
  let bathQuoteInstance;

  describe("Deployment", async function () {
    it("is deployed", async function () {
      rubiconMarketInstance = await RubiconMarket.deployed();
      bathHouseInstance = await BathHouse.deployed();
      DAIInstance = await DAI.deployed();
      WETHInstance = await WETH.deployed();
      bathPairInstance = await BathPair.deployed();
    });
  });

  describe("Bath House Initialization of Bath Pair and Bath Tokens", async function () {
    it("Bath House is deployed and initialized", async function () {
      // Call initialize on Bath house
      return await bathHouseInstance.initialize(
        rubiconMarketInstance.address,
        80,
        10,
        20
      );
    });
    it("Bath Token for asset is deployed and initialized", async function () {
      return await BathToken.new().then(async function (instance) {
        await instance.initialize(
          "bathWETH",
          WETHInstance.address,
          rubiconMarketInstance.address,
          bathHouseInstance.address,
          accounts[0]
        );
        bathAssetInstance = await instance;
      });
    });
    it("Bath Token for quote is deployed and initialized", async function () {
      return await BathToken.new().then(async function (instance) {
        await instance.initialize(
          "bathDAI",
          DAIInstance.address,
          rubiconMarketInstance.address,
          bathHouseInstance.address,
          accounts[0]
        );
        bathQuoteInstance = await instance;
      });
    });
    it("Bath Pair is deployed and initialized w/ BathHouse", async function () {
      await bathPairInstance.initialize(
        bathAssetInstance.address,
        bathQuoteInstance.address,
        bathHouseInstance.address,
        500,
        -5
      );

      await bathHouseInstance.initBathPair(
        WETHInstance.address,
        DAIInstance.address,
        bathPairInstance.address,
        5
      ); // 90% reserve ratio and 3 days cancel delay
      newPair = await bathHouseInstance.getBathPair(
        WETHInstance.address,
        DAIInstance.address
      );
      logIndented("New BathPair: ", newPair);
    });
    it("can correctly spawn bathWETH and bathDAI", async function () {
      // bathPairInstance = await BathPair.at(newPair);
      bathAssetAddress = await bathPairInstance.bathAssetAddress();
      logIndented("bathWETH address: ", bathAssetAddress);
      bathQuoteAddress = await bathPairInstance.bathQuoteAddress();
      logIndented("bathDAI address: ", bathQuoteAddress);

      // bathAssetInstance = await BathToken.at(bathAssetAddress);
      // bathQuoteInstance = await BathToken.at(bathQuoteAddress);

      assert.equal(
        await bathPairInstance.bathAssetAddress(),
        bathAssetInstance.address
      );
      assert.equal(
        await bathPairInstance.bathQuoteAddress(),
        bathQuoteInstance.address
      );
    });
    it("bath tokens have the right name", async function () {
      assert.equal(await bathAssetInstance.symbol(), "bathWETH");
      assert.equal(await bathQuoteInstance.symbol(), "bathDAI");
    });
    it("User can deposit asset funds with custom weights and receive bathTokens", async function () {
      await WETHInstance.deposit({
        from: accounts[1],
        value: web3.utils.toWei((1).toString()),
      });
      await WETHInstance.approve(
        bathAssetInstance.address,
        web3.utils.toWei((1).toString()),
        { from: accounts[1] }
      );
      await bathAssetInstance.deposit(web3.utils.toWei((1).toString()), {
        from: accounts[1],
      });
      assert.equal(
        (await bathAssetInstance.balanceOf(accounts[1])).toString(),
        web3.utils.toWei((1).toString())
      );
    });
    it("User can deposit quote funds with custom weights and receive bathTokens", async function () {
      await DAIInstance.faucet({ from: accounts[2] });
      await DAIInstance.approve(
        bathQuoteInstance.address,
        web3.utils.toWei((100).toString()),
        { from: accounts[2] }
      );
      await bathQuoteInstance.deposit(web3.utils.toWei((100).toString()), {
        from: accounts[2],
      });
      assert.equal(
        (await bathQuoteInstance.balanceOf(accounts[2])).toString(),
        web3.utils.toWei((100).toString())
      );
    });
    it("Withdraw asset funds by sending in bathTokens", async function () {
      await bathAssetInstance.withdraw(web3.utils.toWei((1).toString()), {
        from: accounts[1],
      });
      assert.equal(
        await WETHInstance.balanceOf(accounts[1]),
        web3.utils.toWei((1).toString())
      );
    });
    it("Withdraw quote funds by sending in bathTokens", async function () {
      await bathQuoteInstance.withdraw(web3.utils.toWei((100).toString()), {
        from: accounts[2],
      });
      assert.equal(
        (await DAIInstance.balanceOf(accounts[2])).toString(),
        web3.utils.toWei("1000").toString()
      );
    });
    it("both users have no bath Tokens post withdraw", async function () {
      assert.equal("0", await bathAssetInstance.balanceOf(accounts[1]));
      assert.equal("0", await bathQuoteInstance.balanceOf(accounts[2]));
    });
  });

  // Test Market making functionality:
  describe("Liquidity Providing Tests", async function () {
    // Bid and ask made by Pools throughout the test
    const askNumerator = web3.utils.toWei((0.01).toString());
    const askDenominator = web3.utils.toWei((0.5).toString());
    const bidNumerator = web3.utils.toWei((0.4).toString());
    const bidDenominator = web3.utils.toWei((0.01).toString());

    it("User can deposit asset funds with custom weights and receive bathTokens", async function () {
      await WETHInstance.deposit({
        from: accounts[1],
        value: web3.utils.toWei((10).toString()),
      });
      await WETHInstance.approve(
        bathAssetInstance.address,
        web3.utils.toWei((10).toString()),
        { from: accounts[1] }
      );

      await bathAssetInstance.deposit(web3.utils.toWei((10).toString()), {
        from: accounts[1],
      });
      assert.equal(
        (await bathAssetInstance.balanceOf(accounts[1])).toString(),
        web3.utils.toWei((10).toString())
      );
    });
    it("Users can deposit quote funds with custom weights and receive bathTokens", async function () {
      await DAIInstance.faucet({ from: accounts[2] });
      await DAIInstance.approve(
        bathQuoteInstance.address,
        web3.utils.toWei((100).toString()),
        { from: accounts[2] }
      );

      await bathQuoteInstance.deposit(web3.utils.toWei((100).toString()), {
        from: accounts[2],
      });
      assert.equal(
        (await bathQuoteInstance.balanceOf(accounts[2])).toString(),
        web3.utils.toWei((100).toString())
      );
    });
    it("Place a starting pair to clear checks", async function () {
      await WETHInstance.deposit({
        from: accounts[3],
        value: web3.utils.toWei((0.5).toString()),
      });
      await WETHInstance.approve(
        rubiconMarketInstance.address,
        web3.utils.toWei((0.5).toString()),
        { from: accounts[3] }
      );
      await rubiconMarketInstance.offer(
        web3.utils.toWei((0.1).toString(), "ether"),
        WETHInstance.address,
        web3.utils.toWei((5).toString(), "ether"),
        DAIInstance.address,
        0,
        { from: accounts[3] }
      );

      // To trigger faucet again:
      // helper.advanceTimeAndBlock(8700);
      await DAIInstance.faucet({ from: accounts[4] });
      await DAIInstance.approve(
        rubiconMarketInstance.address,
        web3.utils.toWei((70).toString()),
        { from: accounts[4] }
      );
      await rubiconMarketInstance.offer(
        web3.utils.toWei((4).toString(), "ether"),
        DAIInstance.address,
        web3.utils.toWei((0.1).toString(), "ether"),
        WETHInstance.address,
        0,
        { from: accounts[4], gas: 0x1ffffff }
      );
    });
    it("Can initialize an approved strategy", async function () {
      strategyInstance = await BidAskUtil.deployed();

      await bathHouseInstance.approveStrategy(strategyInstance.address);
      assert.equal(await strategyInstance.initialized(), true);
    });
    it("Any user can call executeStrategy() on bath Pairs", async function () {
      await bathPairInstance.executeStrategy(
        strategyInstance.address,
        askNumerator,
        askDenominator,
        bidNumerator,
        bidDenominator
      );
    });
    it("bathTokens maintains the correct underlyingBalance()", async function () {
      assert.equal(
        (await bathAssetInstance.underlyingBalance()).toString(),
        web3.utils.toWei((10).toString())
      );
    });
    it("Taker can fill part of trade", async function () {
      await WETHInstance.deposit({
        from: accounts[5],
        value: web3.utils.toWei((100).toString()),
      });
      await WETHInstance.approve(
        rubiconMarketInstance.address,
        web3.utils.toWei((100).toString()),
        { from: accounts[5] }
      );

      await rubiconMarketInstance.buy(4, web3.utils.toWei((0.4).toString()), {
        from: accounts[5],
      });
    });
    it("bathScrub can be called by anyone at any time", async function () {
      let target = 6;
      for (let index = 0; index < target; index++) {
        await bathPairInstance.executeStrategy(
          strategyInstance.address,
          askNumerator,
          askDenominator,
          bidNumerator,
          bidDenominator
        );
        // await rubiconMarketInstance.buy(4 + (2 * (index + 1)), web3.utils.toWei((0.4).toString()), {
        //   from: accounts[5],
        // });
        // logIndented(
        //   "cost of executeStrategy:",
        //   await bathPairInstance
        //     .executeStrategy
        //     .estimateGas(
        //       strategyInstance.address,
        //       askNumerator,
        //       askDenominator,
        //       bidNumerator,
        //       bidDenominator
        //     ),
        //     index
        // );
      }
      // helper.advanceTimeAndBlock(20);
      // logIndented("cost of bathScrub:", await bathPairInstance.bathScrub.estimateGas());
      await bathPairInstance.bathScrub();
      await bathPairInstance.bathScrub();
      await bathPairInstance.bathScrub();
      await bathPairInstance.bathScrub();
      // Idea here is that the start of the local search rolls over after indexs 4-6 are checked in seconds call
      // assert.equal(await bathPairInstance.start().toString(), "0");
    });
    it("bathTokens are correctly logging outstandingAmount", async function () {
      let target = 6;
      for (let index = 0; index < target; index++) {
        await bathPairInstance.executeStrategy(
          strategyInstance.address,
          askNumerator,
          askDenominator,
          bidNumerator,
          bidDenominator
        );
      }
      helper.advanceTimeAndBlock(100);
      await bathPairInstance.bathScrub();
      await bathPairInstance.bathScrub();
      await bathPairInstance.bathScrub();
      await bathPairInstance.bathScrub();
      await bathPairInstance.bathScrub();
      await bathPairInstance.bathScrub();

      assert.equal(
        (await bathAssetInstance.outstandingAmount()).toString(),
        "0"
      );
      assert.equal(
        (await bathQuoteInstance.outstandingAmount()).toString(),
        "0"
      );
    });
    it("Partial fill is correctly cancelled and replaced", async function () {
      await bathPairInstance.bathScrub();

      await bathPairInstance.executeStrategy(
        strategyInstance.address,
        askNumerator,
        askDenominator,
        bidNumerator,
        bidDenominator
      );
    });
    it("Zero order can be placed - bid or ask", async function () {
      await bathPairInstance.executeStrategy(
        strategyInstance.address,
        0,
        0,
        bidNumerator,
        bidDenominator
      );
      await bathPairInstance.executeStrategy(
        strategyInstance.address,
        askNumerator,
        askDenominator,
        0,
        0
      );
      await bathPairInstance.bathScrub();
    });
    it("Strategist can cancel an order they made", async function () {
      await bathPairInstance.removeLiquidity(7);
      // assert.equal((await bathPairInstance.getOutstandingPairCount()).toString(), "2");
    });
    it("New strategist can be added to pools ", async function () {
      await bathHouseInstance.approveStrategist(accounts[6]);
      await bathPairInstance.executeStrategy(
        strategyInstance.address,
        askNumerator,
        askDenominator,
        bidNumerator,
        bidDenominator,
        { from: accounts[6] }
      );
      // await bathPairInstance.removeLiquidity(10, {from: accounts[6]});
    });
    // for (let i = 1; i < 10; i++) {
    //     it(`Spamming of executeStrategy iteration: ${i}`, async function () {
    //         await bathPairInstance.executeStrategy(strategyInstance.address, askNumerator, askDenominator, bidNumerator, bidDenominator);
    //         // TODO: log gas while looping through multiple bathScrub calls
    //         // See how it scales and if a solution is available to make it more gas efficient
    //         // --> why in the OVM is bathScrub failing? This is the goal...

    //         await rubiconMarketInstance.buy(8 + (i*2), web3.utils.toWei((0.4).toString()), { from: accounts[5] });
    //         // console.log(await bathPairInstance.executeStrategy.estimateGas(strategyInstance.address, askNumerator, askDenominator, bidNumerator, bidDenominator));
    //         // console.log("IDs of new trades: ",  await bathPairInstance.getLastTradeIDs());
    //         let outstandingPairs = await bathPairInstance.getOutstandingPairCount();
    //         if (outstandingPairs > 5) {
    //             await bathPairInstance.bathScrub();
    //         }
    //         // console.log("outstanding pairs: ", await bathPairInstance.getOutstandingPairCount());
    //     });
    // }
    it("Funds are correctly returned to bathTokens", async function () {
      await bathPairInstance.bathScrub();
      assert.equal(
        (await WETHInstance.balanceOf(bathQuoteInstance.address)).toString(),
        "0"
      );
      assert.equal(
        (await DAIInstance.balanceOf(bathAssetInstance.address)).toString(),
        "0"
      );
    });
    it("Strategist can claim funds", async function () {
      await bathPairInstance.strategistBootyClaim();
      // TODO: validate this is correct
      assert.equal(
        (await WETHInstance.balanceOf(accounts[0])).toString(),
        "20000000000000"
      );
    });
  });
});
