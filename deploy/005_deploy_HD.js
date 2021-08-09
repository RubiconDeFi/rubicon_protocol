const { BigNumber } = require("ethers");
const { LedgerSigner } = require("@ethersproject/hardware-wallets");

require("dotenv").config();

// *** Nonce Manager ***
let baseNonce = web3.eth.getTransactionCount(
  process.env.CORP_HD_ACCOUNT_0 //deployer
); //HD deployer
let nonceOffset = 0;
function getNonce() {
  return baseNonce.then((nonce) => nonce + nonceOffset++);
}

// Deploy test assets for Kovan OP testnet
const func = async (hre) => {
  const { deployments, getNamedAccounts, web3 } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // HD WALLET EXAMPLE
  // const ledger = await new LedgerSigner(
  //   contractFactory.signer.provider,
  //   "hid",
  //   "m/44'/60'/0'/0"
  // );
  // contractFactory = await contractFactory.connect(ledger);
  const provider = new hre.ethers.providers.JsonRpcProvider(
    "https://optimism-kovan.infura.io/v3/" + process.env.INFURA_API_KEY
  );
  const type = "hid";
  const path_0 = `m/44'/60'/0'/0/0`;

  const feeRecipient = process.env.CORP_HD_ACCOUNT_2;
  const deployerAddress = process.env.CORP_HD_ACCOUNT_0;
  const proxyAddress = process.env.CORP_HD_ACCOUNT_1;

  // Note: can only have one at a time
  const HD_deployer = new LedgerSigner(provider, type, path_0);
  // const HD_proxyAdmin = new LedgerSigner(provider, type, path_1);
  // const HD_feeTo = new LedgerSigner(provider, type, path_2);

  const HD_deployer_Addr = await HD_deployer.getAddress();
  console.log("HD Deployer Address:", HD_deployer_Addr);
  // const HD_proxyAdmin_Addr = await HD_proxyAdmin.getAddress();
  // console.log("HD Deployer Address:", HD_proxyAdmin_Addr);
  // const HD_feeTo_Addr = await HD_feeTo.getAddress();
  // console.log("HD Deployer Address:", HD_feeTo_Addr);

  // ********************************
  // //1. Deploy and init Rubicon Market
  // const bh = await hre.ethers.getContractFactory("RubiconMarket");
  // const contractFactory = await bh.connect(HD_deployer);
  // await contractFactory.deploy({ nonce: await getNonce() }).then(async function (r) {
  //   console.log("Rubicon market deployed at: " + (await r.address));
  //   await deployProxy(await r.address, "Rubicon Market").then(
  //     async (proxyWrapped) => {
  //       // console.log("proxywrapped", proxyWrapped);
  //       const BHI = await bh.attach(proxyWrapped);
  //       await BHI.estimateGas
  //         .initialize(false, feeRecipient)
  //         .then(async function (g) {
  //           await BHI.connect(HD_deployer).initialize(false, feeRecipient, {
  //             gasLimit: g._hex,
  //           }).then((r) => console.log("Market Init Call sent!\n"));
  //         });
  //     }
  //   );
  // });

  // //2. Deploy and init BathHouse
  // const bathFactory = await hre.ethers.getContractFactory("BathHouse");
  // const contractFactoryBH = await bathFactory.connect(HD_deployer);
  // await contractFactoryBH.deploy({ nonce: await getNonce() }).then(async function (r) {
  //   console.log("BathHouse deployed at: " + (await r.address));
  //   await deployProxy(await r.address, "Bath House").then(
  //     async (proxyWrapped) => {
  //       // console.log("proxywrapped", proxyWrapped);
  //       const BHI = await bathFactory.attach(proxyWrapped);
  //       await BHI.estimateGas
  //         .initialize(process.env.OP_KOVAN_4_MARKET, 80, 8640, 15) // 80% reserve Ratio, 0.1 day time delay, 15 max outstanding pairs
  //         .then(async function (g) {
  //           await BHI.connect(HD_deployer).initialize(process.env.OP_KOVAN_4_MARKET, 80, 8640, 15, {
  //             gasLimit: g._hex,
  //           }).then((r) => console.log("Bath House Init Call sent!\n"));
  //         });
  //     }
  //   );
  // });

  // // 3.
  // // deploy BathTokens
  // const assetsToDeploy = [
  //   "WBTC",
  //   "MKR",
  //   "SNX",
  //   "REP",
  //   "RGT",
  //   "ETH",
  //   "USDC",
  //   "OHM",
  //   "COMP",
  //   "AAVE",
  // ];

  // for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathTokenF = await hre.ethers.getContractFactory("BathToken");
  //   const bathTokenFactory = await bathTokenF.connect(HD_deployer);
  //   const newBathToken = await bathTokenFactory
  //     .deploy({ nonce: getNonce() })
  //     .then(async function (r) {
  //       console.log("bath" + asset + " deployed at " + (await r.address));
  //       await deployProxy(await r.address, "bath" + asset).then(
  //         async (proxyWrapped) => {
  //           const btUInst = await bathTokenFactory.attach(proxyWrapped);
  //           await btUInst.estimateGas
  //             .initialize(
  //               "bath" + asset,
  //               process.env["OP_KOVAN_4_" + asset],
  //               process.env.OP_KOVAN_4_MARKET,
  //               process.env.OP_KOVAN_4_BATHHOUSE,
  //               feeRecipient,
  //               { gasLimit: 8999999 }
  //             )
  //             .then(async function (g) {
  //               await btUInst
  //                 .connect(HD_deployer)
  //                 .initialize(
  //                   "bath" + asset,
  //                   process.env["OP_KOVAN_4_" + asset],
  //                   process.env.OP_KOVAN_4_MARKET,
  //                   process.env.OP_KOVAN_4_BATHHOUSE,
  //                   feeRecipient,
  //                   { gasLimit: g._hex, nonce: getNonce() }
  //                 )
  //                 .then((r) =>
  //                   console.log("init of bath" + asset + " success")
  //                 );
  //               return r.address;
  //             });
  //         }
  //       );
  //     });
  // }

  // // 4. Deploy BathPairs - init is failing!
  // const assetsToDeploy = [
  //   "WBTC",
  //   "MKR",
  //   "SNX",
  //   "REP",
  //   "RGT",
  //   "ETH",
  //   "OHM",
  //   "COMP",
  //   "AAVE",
  // ];

  // for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathPairFactory1 = await hre.ethers.getContractFactory("BathPair");
  //   const bathPairFactory = await bathPairFactory1.connect(HD_deployer);
  //   const newBathPair = await bathPairFactory
  //     .deploy({ nonce: getNonce() })
  //     .then(async function (r) {
  //       await deployProxy(await r.address, "bath" + asset + "USDC").then(
  //         async (proxyWrapped) => {
  //           console.log(
  //             "bath" + asset + "-USDC deployed at " + (await r.address)
  //           );
  //           const btUInst = await bathPairFactory.attach(proxyWrapped);
  //           await btUInst.estimateGas
  //             .initialize(
  //               process.env["OP_KOVAN_4_BATH" + asset],
  //               process.env.OP_KOVAN_4_BATHUSDC,
  //               process.env.OP_KOVAN_4_BATHHOUSE,
  //               50,
  //               -5,
  //               { gasLimit: 8999999 }
  //             )
  //             .then(async function (g) {
  //               await btUInst.connect(HD_deployer)
  //                 .initialize(
  //                   process.env["OP_KOVAN_4_BATH" + asset],
  //                   process.env.OP_KOVAN_4_BATHUSDC,
  //                   process.env.OP_KOVAN_4_BATHHOUSE,
  //                   50,
  //                   -5,
  //                   { gasLimit: g._hex, nonce: getNonce() }
  //                 )
  //                 .then((r) =>
  //                   console.log("init of bath" + asset + "-USDC success")
  //                 );
  //             });
  //         }
  //       );
  //     });
  // }

  // **Make sure env is updated for the below if want to init after deploy seperately
  // // 4b - IF NEEDED - Init each Bath Pair
  // const assetsToDeploy = ["WBTC", "MKR", "SNX", "REP", "RGT", "ETH", "OHM", "COMP", "AAVE"];
  // for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathPairFactory = await hre.ethers.getContractFactory("BathPair").connect(HD_deployer);
  //   const btUInst = await bathPairFactory.attach(
  //     process.env["OP_KOVAN_3_BATH" + asset + "USDC"]
  //   );
  //   await btUInst.estimateGas
  //     .initialize(
  //       process.env["OP_KOVAN_3_BATH" + asset],
  //       process.env.OP_KOVAN_3_BATHUSDC,
  //       process.env.OP_KOVAN_3_BATHHOUSE,
  //       75,
  //       -5,
  //       { gasLimit: 8999999 }
  //     )
  //     .then(async function (g) {
  //       await btUInst
  //         .initialize(
  //           process.env["OP_KOVAN_3_BATH" + asset],
  //           process.env.OP_KOVAN_3_BATHUSDC,
  //           process.env.OP_KOVAN_3_BATHHOUSE,
  //           75,
  //           -5,
  //           { gasLimit: g._hex, nonce: getNonce() }
  //         )
  //         .then((r) => console.log("init of bath" + asset + "-USDC success"));
  //     });
  // }

  // // 5. Deploy and init -> approve on BH BidAskUtil
  // const bh = await hre.ethers.getContractFactory("BidAskUtil");
  // const contractFactory = await bh.connect(HD_deployer);
  // await contractFactory
  //   .deploy({ nonce: await getNonce() })
  //   .then(async function (r) {
  //     console.log("Bid ask Util deployed at: " + (await r.address));
  //     await deployProxy(await r.address, "BidAskUtil").then(
  //       async (proxyWrapped) => {
  //         // console.log("proxywrapped", proxyWrapped);
  //         const bauFactory = await hre.ethers.getContractFactory("BidAskUtil");
  //         const btUInst = await bauFactory.attach(proxyWrapped);
  //         await btUInst.estimateGas
  //           .initialize(
  //             "BidAskUtil",
  //             process.env.OP_KOVAN_4_BATHHOUSE,
  //             process.env.OP_KOVAN_4_MARKET
  //           )
  //           .then(async function (g) {
  //             await btUInst
  //               .connect(HD_deployer)
  //               .initialize(
  //                 "BidAskUtil",
  //                 process.env.OP_KOVAN_4_BATHHOUSE,
  //                 process.env.OP_KOVAN_4_MARKET,
  //                 { gasLimit: g._hex, nonce: getNonce() }
  //               )
  //               .then((r) => console.log("init of BAU success"));
  //           });
  //         // Init on BathHouse
  //         const bh = await hre.ethers.getContractFactory("BathHouse");
  //         const BHI = await bh.attach(process.env.OP_KOVAN_4_BATHHOUSE);
  //         await BHI.connect(HD_deployer)
  //           .approveStrategy(proxyWrapped, {
  //             nonce: getNonce(),
  //           })
  //           .then((r) => console.log("ApproveStrategy call sent!\n"));
  //       }
  //     );
  //   });

  // // 6. Approve BathPairs on BathHouse
  // const assetsToDeploy = [
  //   "WBTC",
  //   "MKR",
  //   "SNX",
  //   "REP",
  //   "RGT",
  //   "ETH",
  //   "OHM",
  //   "COMP",
  //   "AAVE",
  // ];
  // for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_4_BATHHOUSE);
  //   await bh
  //     .connect(HD_deployer)
  //     .initBathPair(
  //       process.env["OP_KOVAN_4_" + asset],
  //       process.env.OP_KOVAN_4_USDC,
  //       process.env["OP_KOVAN_4_BATH" + asset + "USDC"],
  //       1,
  //       { nonce: getNonce() }
  //     )
  //     .then((r) => console.log("init of bath" + asset + "-USDC success on BH"));
  // }

  // // 7. Approve Strategist
  // const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  // const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_4_BATHHOUSE);
  // let newStrategist = process.env.OP_KOVAN_ADMIN;
  // await bh
  //   .connect(HD_deployer)
  //   .approveStrategist(newStrategist)
  //   .then((r) => console.log("approved this strategist", newStrategist));

  // ****************************
  // const USDCFactory = await hre.ethers.getContractFactory("USDCWithFaucet");
  // await USDCFactory.deploy(69, process.env.OP_KOVAN_ADMIN, "USDC", "USDC", {gasLimit: 114380000, nonce: getNonce()}).then((r) => {console.log("deployed new USDC at ", r.address)})

  // const assetsToDeploy = [
  //   "WBTC",
  //   "MKR",
  //   "SNX",
  //   "REP",
  //   "RGT",
  //   "OHM",
  //   "COMP",
  //   "AAVE",
  //   "ETH",
  //   //"USDC" //*
  // ];

  // // deploy contracts
  // for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const TokenFactory = await hre.ethers.getContractFactory("EquityToken");
  //   await TokenFactory.deploy(process.env.OP_KOVAN_ADMIN, web3.utils.toWei("1000000"), asset, asset, {nonce:getNonce()}).then(async function(r) {
  //     console.log(asset + " deployed at " + await r.address);
  //   });
  // }

  // // Deploy BathPairs w/o proxies
  // for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathPairFactory = await hre.ethers.getContractFactory("BathPair");
  //   const newBathPair = await bathPairFactory
  //     .deploy({ nonce: getNonce() })
  //     .then(async function (r) {
  //       console.log("bath" + asset + "-USDC deployed at " + (await r.address));
  //       //   const btUInst = await bathPairFactory.attach(await r.address);
  //       //   await btUInst.estimateGas.initialize(process.env['OP_KOVAN_3_BATH'+asset], process.env.OP_KOVAN_3_BATHUSDC, process.env.OP_KOVAN_3_BATHHOUSE, 500, -5, {gasLimit: 8999999}) .then(async function (g) {
  //       //     await btUInst.initialize(process.env['OP_KOVAN_3_BATH'+asset], process.env.OP_KOVAN_3_BATHUSDC, process.env.OP_KOVAN_3_BATHHOUSE, 500, -5, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bath" + asset+ "-USDC success"));
  //       // });
  //     });
  // }

  // // Approve BathPairs on BathHouse
  //   for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_3_BATHHOUSE);
  //   await bh.estimateGas.initBathPair(process.env['OP_KOVAN_3_'+asset], process.env.OP_KOVAN_3_USDC, process.env['OP_KOVAN_3_BATH'+asset+'USDC'], 5).then(async function(g) {
  //             await bh.initBathPair(process.env['OP_KOVAN_3_'+asset], process.env.OP_KOVAN_3_USDC, process.env['OP_KOVAN_3_BATH'+asset+'USDC'], 5, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bath" + asset+ "-USDC success on BH"));
  //         });

  // }

  // remove BathPairs on BathHouse
  // for (let index = 0; index < assetsToDeploy.length; index++) {
  // const asset = assetsToDeploy[index];
  // const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  // const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_3_BATHHOUSE);
  // await bh.estimateGas.removePair(process.env['OP_KOVAN_3_BATH'+asset+'USDC']).then(async function(g) {
  //           await bh.removePair(process.env['OP_KOVAN_3_BATH'+asset+'USDC'], {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("remove of bath" + asset+ "-USDC success on BH"));
  //       });

  //  }

  // // // Deploy BathToken for USDC
  //    const bathTokenFactoryUSDC = await hre.ethers.getContractFactory('BathToken');
  //    const bathUSDCAddr = await bathTokenFactoryUSDC.deploy({nonce: getNonce()}).then(async function(r) {
  //     console.log("bathUSDC deployed at " + await r.address);
  //     const btUInst = await bathTokenFactoryUSDC.attach(await r.address);
  //     await btUInst.estimateGas.initialize("bathUSDC", process.env.OP_KOVAN_3_USDC, process.env.OP_KOVAN_3_MARKET, process.env.OP_KOVAN_3_BATHHOUSE, {gasLimit: 8999999}) .then(async function (g) {
  //       await btUInst.initialize("bathUSDC", process.env.OP_KOVAN_3_USDC, process.env.OP_KOVAN_3_MARKET, process.env.OP_KOVAN_3_BATHHOUSE, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of Bath USDC success"));
  //   });
  // });

  //   // // Deploy BathToken for ETH
  //    const bathTokenFactoryUSDC = await hre.ethers.getContractFactory('BathToken');
  //    const bathUSDCAddr = await bathTokenFactoryUSDC.deploy({nonce: getNonce()}).then(async function(r) {
  //     console.log("bathETH deployed at " + await r.address);
  //     const btUInst = await bathTokenFactoryUSDC.attach(await r.address);
  //     await btUInst.estimateGas.initialize("bathETH", process.env.OP_KOVAN_3_ETH, process.env.OP_KOVAN_3_MARKET, process.env.OP_KOVAN_3_BATHHOUSE, {gasLimit: 8999999}) .then(async function (g) {
  //       await btUInst.initialize("bathETH", process.env.OP_KOVAN_3_ETH, process.env.OP_KOVAN_3_MARKET, process.env.OP_KOVAN_3_BATHHOUSE, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of Bath USDC success"));
  //   });
  // });

  // // Deploy bathETHUSDC
  // const bathPairFactory = await hre.ethers.getContractFactory("BathPair");
  //     const newBathPair = await bathPairFactory.deploy({nonce: getNonce()}).then(async function(r) {
  //             console.log("bathETH-USDC deployed at " + await r.address);
  //             const btUInst = await bathPairFactory.attach(await r.address);
  //             await btUInst.estimateGas.initialize(process.env['OP_KOVAN_3_BATHETH'], process.env.OP_KOVAN_3_BATHUSDC, process.env.OP_KOVAN_3_BATHHOUSE, 500, -5, {gasLimit: 8999999}) .then(async function (g) {
  //               await btUInst.initialize(process.env['OP_KOVAN_3_BATHETH'], process.env.OP_KOVAN_3_BATHUSDC, process.env.OP_KOVAN_3_BATHHOUSE, 500, -5, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bath ETH-USDC success"));
  //           });
  //     });

  // // Init bathETH
  //   const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_3_BATHHOUSE);
  //   await bh.estimateGas.initBathPair(process.env['OP_KOVAN_3_ETH'], process.env.OP_KOVAN_3_USDC, process.env['OP_KOVAN_3_BATHETHUSDC'], 5).then(async function(g) {
  //             await bh.initBathPair(process.env['OP_KOVAN_3_ETH'], process.env.OP_KOVAN_3_USDC, process.env['OP_KOVAN_3_BATHETHUSDC'], 5, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bathETH-USDC success on BH"));
  //         });

  //   // set max ordersize bps on BathHouse
  //   for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_3_BATHHOUSE);
  //   await bh.estimateGas.setBathPairMOSBPS(process.env['OP_KOVAN_3_BATH'+asset+'USDC'], 25).then(async function(g) {
  //             await bh.setBathPairMOSBPS(process.env['OP_KOVAN_3_BATH'+asset+'USDC'], 25,{gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("set max order size bps " + asset+ "-USDC success on BH"));
  //         });

  // }

  // // set BathHouse Variable - Set time delay
  // const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  // const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_3_BATHHOUSE);
  // await bh.estimateGas.setCancelTimeDelay(1200).then(async function (g) {
  //   await bh
  //     .setCancelTimeDelay(1200, { gasLimit: g._hex, nonce: getNonce() })
  //     .then((r) => console.log("set time delay on BH", r));
  // });

  // // set BathHouse Variable - Set search radius
  //   const assetsToDeploy = [
  //   // "WBTC",
  //   "MKR",
  //   "SNX",
  //   "REP",
  //   "RGT",
  //   "OHM",
  //   "COMP",
  //   "AAVE",
  //   "ETH",
  //   //"USDC" //*
  // ];

  // for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_3_BATHHOUSE);
  //   // await bh.estimateGas.setBathPairSearchRadius(process.env.OP_KOVAN_3_BATHWBTCUSDC, 3).then(async function (g) {
  //     await bh
  //       .setBathPairSearchRadius(process.env["OP_KOVAN_3_BATH" + asset + "USDC"], 3, { gasLimit: 900000 , nonce: getNonce() })
  //       .then((r) => console.log("set search radius for " + "bath" + asset + "USDC"));
  //   // });
  // }

  // // set BathHouse Variable - MOPC
  // const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  // const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_3_BATHHOUSE);
  // await bh.estimateGas.setMaxOutstandingPairCount(5).then(async function (g) {
  //   await bh
  //     .setMaxOutstandingPairCount(5, { gasLimit: g._hex, nonce: getNonce() })
  //     .then((r) => console.log("set time delay on BH", r));
  // });

  // // Whitelist a strategist
  // const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  // const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_3_BATHHOUSE);
  // let newStrategist = process.env.OP_KOVAN_ADMIN;
  // await bh.estimateGas.approveStrategist(newStrategist).then(async function(g) {
  //           await bh.approveStrategist(newStrategist).then((r) => console.log("approved this strategist ", newStrategist));
  // });

  // // // set market Variable
  //   const bathHouseFactory = await hre.ethers.getContractFactory("RubiconMarket");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_3_MARKET);
  //   await bh.estimateGas.setMatchingEnabled(true).then(async function(g) {
  //             await bh.setMatchingEnabled(true, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("set matching enabled on BH"));
  //   });

  // const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  // const bh = await bathHouseFactory.attach("0x61435E59B6840c7B3f4efbDc07b0f57c1D9f71Ac");
  // console.log(await bh.RubiconMarketAddress());

  // ************** Proxies ***********************

  // Deploy TransparentUpgradeableProxy
  // return the address of the proxy that wraps `address`
  async function deployProxy(address, msg) {
    const proxyFactory = await hre.ethers.getContractFactory(
      "TransparentUpgradeableProxy"
    );
    const contractFactory = await proxyFactory.connect(HD_deployer);
    return await contractFactory
      .deploy(await address, process.env.CORP_HD_ACCOUNT_1, "0x", {
        nonce: await getNonce(),
        gasLimit: 9220000,
      })
      .then(async function (r) {
        console.log(
          "Transparent Upgradeable Proxy deployed at: " +
            (await r.address) +
            " for " +
            msg +
            " " +
            address
        );
        return await r.address;
      });
  }
};

func.tags = ["Assets"];
module.exports = func;