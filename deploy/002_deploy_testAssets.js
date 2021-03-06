const { BigNumber } = require("ethers");

require("dotenv").config();

// Deploy test assets for Kovan OP testnet
const func = async (hre) => {
  const { deployments, getNamedAccounts, web3 } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()


  // *** Nonce Manager ***
  let baseNonce = web3.eth.getTransactionCount(process.env.OP_KOVAN_ADMIN);
  let nonceOffset = 0;
  function getNonce() {
    return baseNonce.then((nonce) => (nonce + (nonceOffset++)));
  }

  // ********************************
// //1. Deploy and init Rubicon Market
// const deployResultBH = await deploy('RubiconMarket', {
//   from: deployer,
//   log: true,
//   gasLimit: 337220000,
//   nonce: getNonce()
// }).then(async function(d) {
//   const newBHAddr = await d.address;
//   console.log(`Market is at ${newBHAddr}`);
//   if (await d.newlyDeployed) {
//   console.log(
//     `contract RubiconMarket deployed at ${newBHAddr}`
//   );

//   await deployProxy(newBHAddr, "Rubicon Market").then(async (proxyWrapped) =>  {
//         console.log("proxywrapped", proxyWrapped);

//         // Init BathHouse
//         const bh = await hre.ethers.getContractFactory("RubiconMarket");
//         const BHI = await bh.attach(proxyWrapped);
//         await BHI.estimateGas.initialize(false, process.env.OP_KOVAN_TC_FEE_RECIPIENT).then(async function(g) {
//           await BHI.initialize(false, process.env.OP_KOVAN_TC_FEE_RECIPIENT, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("Market Init Call sent!\n"));
//           return newBHAddr;          
//         }); //.then(async (addr) => {await deployProxy(addr, "bathHouse")});
//   });
//   }
// });

// //2. Deploy and init BathHouse
// const deployResultBH = await deploy('BathHouse', {
//   from: deployer,
//   log: true,
//   gasLimit: 135990000,
//   nonce: getNonce()
// }).then(async function(d) {
//   const newBHAddr = await d.address;
//   console.log(`bathHouse is at ${newBHAddr}`);
//   if (await d.newlyDeployed) {
//   console.log(
//     `contract BathHouse deployed at ${newBHAddr}`
//   );

//   await deployProxy(newBHAddr, "bathHouse").then(async (proxyWrapped) =>  {
//         console.log("proxywrapped", proxyWrapped);

//         // Init BathHouse
//         const bh = await hre.ethers.getContractFactory("BathHouse");
//         const BHI = await bh.attach(proxyWrapped);
//         await BHI.estimateGas.initialize(process.env.OP_KOVAN_2_MARKET, 80, 86400, 15).then(async function(g) {
//           await BHI.initialize(process.env.OP_KOVAN_2_MARKET, 80, 86400, 15, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("BH Init Call sent!\n"));
//           return newBHAddr;          
//         }); //.then(async (addr) => {await deployProxy(addr, "bathHouse")});
//   });

//   }
// });
// // 3. 
//   // deploy BathTokens
//   const assetsToDeploy = [
//     "WBTC",
//     "MKR",
//     "SNX",
//     "REP",
//     "RGT",
//     "ETH",
//     "USDC"
//   ];

//   for (let index = 0; index < assetsToDeploy.length; index++) {
//     const asset = assetsToDeploy[index];
//     const bathTokenFactory = await hre.ethers.getContractFactory("BathToken");
//     const newBathToken = await bathTokenFactory.deploy({nonce: getNonce()}).then(async function(r) {
//             console.log("bath" + asset +  " deployed at " + await r.address);
//             await deployProxy(await r.address, "bath" + asset).then(async (proxyWrapped) =>  {
//               const btUInst = await bathTokenFactory.attach(proxyWrapped);
//               await btUInst.estimateGas.initialize("bath" + asset, process.env['OP_KOVAN_TC_'+asset], process.env.OP_KOVAN_2_MARKET, process.env.OP_KOVAN_2_BATHHOUSE, {gasLimit: 8999999}) .then(async function (g) {
//                 await btUInst.initialize("bath" + asset, process.env['OP_KOVAN_TC_'+asset], process.env.OP_KOVAN_2_MARKET, process.env.OP_KOVAN_2_BATHHOUSE, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bath" + asset+ " success"));
//                 return r.address;
//                });
//     // await deployProxy(, "bath" + asset)
//     });
//   });
// }

//   // 4. Deploy BathPairs
//     const assetsToDeploy = [
//     "WBTC",
//     "MKR",
//     "SNX",
//     "REP",
//     "RGT",
//     "ETH"
//     // "USDC" - USDC excluded as base
//   ];
//     for (let index = 0; index < assetsToDeploy.length; index++) {
//     const asset = assetsToDeploy[index];
//     const bathPairFactory = await hre.ethers.getContractFactory("BathPair");
//     const newBathPair = await bathPairFactory.deploy({nonce: getNonce()}).then(async function(r) {
//         await deployProxy(await r.address, "bath" + asset+"USDC").then(async (proxyWrapped) =>  {
            
//             console.log("bath" + asset +  "-USDC deployed at " + await r.address);
//             const btUInst = await bathPairFactory.attach(proxyWrapped);
//             await btUInst.estimateGas.initialize(process.env['OP_KOVAN_2_BATH'+asset], process.env.OP_KOVAN_2_BATHUSDC, process.env.OP_KOVAN_2_BATHHOUSE, 75, -5, {gasLimit: 8999999}) .then(async function (g) {
//               await btUInst.initialize(process.env['OP_KOVAN_2_BATH'+asset], process.env.OP_KOVAN_2_BATHUSDC, process.env.OP_KOVAN_2_BATHHOUSE, 75, -5, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bath" + asset+ "-USDC success"));
//           });
//         });
//   });
// }

// // 5. Deploy and init -> approve on BH BidAskUtil
//   const deployResultBH = await deploy('BidAskUtil', {
//     from: deployer,
//     log: true,
//     gasLimit: 135990000,
//     nonce: getNonce()
//   }).then(async function(d) {
//     const newBHAddr = await d.address;
//     console.log(`bidAskUtil is at ${newBHAddr}`);
//     if (await d.newlyDeployed) {
//     console.log(
//       `contract bidAskUtil deployed at ${newBHAddr}`
//     );
  
//     await deployProxy(newBHAddr, "BidAskUtil").then(async (proxyWrapped) =>  {
//           console.log("proxywrapped", proxyWrapped);   
//           const bauFactory = await hre.ethers.getContractFactory("BidAskUtil");
//           const btUInst = await bauFactory.attach(proxyWrapped);
//           await btUInst.estimateGas.initialize("BidAskUtil", process.env.OP_KOVAN_2_BATHHOUSE, process.env.OP_KOVAN_2_MARKET).then(async function (g) {
//             await btUInst.initialize("BidAskUtil", process.env.OP_KOVAN_2_BATHHOUSE, process.env.OP_KOVAN_2_MARKET, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of BAU success"));
//         });
//           // Init on BathHouse
//           const bh = await hre.ethers.getContractFactory("BathHouse");
//           const BHI = await bh.attach(process.env.OP_KOVAN_2_BATHHOUSE);
//           await BHI.estimateGas.approveStrategy(proxyWrapped).then(async function(g) {
//             await BHI.approveStrategy(proxyWrapped, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("ApproveStrategy call sent!\n"));
//             return newBHAddr;          
//           }); //.then(async (addr) => {await deployProxy(addr, "bathHouse")});
//     });
  
//     }
//   });

  // // 6. Approve BathPairs on BathHouse
  // const assetsToDeploy = [
  //   "WBTC",
  //   "MKR",
  //   "SNX",
  //   "REP",
  //   "RGT",
  //   "ETH"
  //   //"USDC" //*
  // ];
  // for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_2_BATHHOUSE);
  //   await bh.estimateGas.initBathPair(process.env['OP_KOVAN_TC_'+asset], process.env.OP_KOVAN_TC_USDC, process.env['OP_KOVAN_2_BATH'+asset+'USDC'], 1).then(async function(g) {
  //             await bh.initBathPair(process.env['OP_KOVAN_TC_'+asset], process.env.OP_KOVAN_TC_USDC, process.env['OP_KOVAN_2_BATH'+asset+'USDC'], 1, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bath" + asset+ "-USDC success on BH"));
  //         });
    
  // }
  // ****************************
  // const USDCFactory = await hre.ethers.getContractFactory("DaiWithFaucet");
  // await USDCFactory.deploy(69, process.env.OP_KOVAN_ADMIN, "USDC", "USDC", {gasLimit: 114380000, nonce: getNonce()}).then((r) => {console.log("deployed new USDC at ", r.address)})

  // const assetsToDeploy = [
  //   "WBTC",
  //   "MKR",
  //   "SNX",
  //   "REP",
  //   "RGT",
  //   "ETH"
  //   //"USDC" //*
  // ];

  // // deploy contracts
  // for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const TokenFactory = await hre.ethers.getContractFactory("EquityToken");
  //   await TokenFactory.deploy(process.env.OP_KOVAN_ADMIN, web3.utils.toWei("1000000"), asset, asset, {nonce:getNonce()}).then(async function(r) {
  //     console.log(asset + " deployed at " + await r.address);
  //   return await r.address;
  //   });
    
  // }

//   // Deploy BathPairs
//     for (let index = 0; index < assetsToDeploy.length; index++) {
//     const asset = assetsToDeploy[index];
//     const bathPairFactory = await hre.ethers.getContractFactory("BathPair");
//     const newBathPair = await bathPairFactory.deploy({nonce: getNonce()}).then(async function(r) {
//             console.log("bath" + asset +  "-USDC deployed at " + await r.address);
//             const btUInst = await bathPairFactory.attach(await r.address);
//             await btUInst.estimateGas.initialize(process.env['OP_KOVAN_TC_BATH'+asset], process.env.OP_KOVAN_TC_BATHUSDC, process.env.OP_KOVAN_TC_BATHHOUSE, 500, -5, {gasLimit: 8999999}) .then(async function (g) {
//               await btUInst.initialize(process.env['OP_KOVAN_TC_BATH'+asset], process.env.OP_KOVAN_TC_BATHUSDC, process.env.OP_KOVAN_TC_BATHHOUSE, 500, -5, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bath" + asset+ "-USDC success"));
//           });
    
//   });
// }

  // // Approve BathPairs on BathHouse
  //   for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_TC_BATHHOUSE);
  //   await bh.estimateGas.initBathPair(process.env['OP_KOVAN_TC_'+asset], process.env.OP_KOVAN_TC_USDC, process.env['OP_KOVAN_TC_BATH'+asset+'USDC'], 5).then(async function(g) {
  //             await bh.initBathPair(process.env['OP_KOVAN_TC_'+asset], process.env.OP_KOVAN_TC_USDC, process.env['OP_KOVAN_TC_BATH'+asset+'USDC'], 5, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bath" + asset+ "-USDC success on BH"));
  //         });
    
  // }

  //   // remove BathPairs on BathHouse
  //   for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_TC_BATHHOUSE);
  //   await bh.estimateGas.removePair(process.env['OP_KOVAN_TC_BATH'+asset+'USDC']).then(async function(g) {
  //             await bh.removePair(process.env['OP_KOVAN_TC_BATH'+asset+'USDC'], {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("remove of bath" + asset+ "-USDC success on BH"));
  //         });
    
  // }

  // // // Deploy BathToken for USDC
  //    const bathTokenFactoryUSDC = await hre.ethers.getContractFactory('BathToken');
  //    const bathUSDCAddr = await bathTokenFactoryUSDC.deploy({nonce: getNonce()}).then(async function(r) {
  //     console.log("bathUSDC deployed at " + await r.address);
  //     const btUInst = await bathTokenFactoryUSDC.attach(await r.address);
  //     await btUInst.estimateGas.initialize("bathUSDC", process.env.OP_KOVAN_TC_USDC, process.env.OP_KOVAN_TC_MARKET, process.env.OP_KOVAN_TC_BATHHOUSE, {gasLimit: 8999999}) .then(async function (g) {
  //       await btUInst.initialize("bathUSDC", process.env.OP_KOVAN_TC_USDC, process.env.OP_KOVAN_TC_MARKET, process.env.OP_KOVAN_TC_BATHHOUSE, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of Bath USDC success"));
  //   });
  // });

  //   // // Deploy BathToken for ETH
  //    const bathTokenFactoryUSDC = await hre.ethers.getContractFactory('BathToken');
  //    const bathUSDCAddr = await bathTokenFactoryUSDC.deploy({nonce: getNonce()}).then(async function(r) {
  //     console.log("bathETH deployed at " + await r.address);
  //     const btUInst = await bathTokenFactoryUSDC.attach(await r.address);
  //     await btUInst.estimateGas.initialize("bathETH", process.env.OP_KOVAN_TC_ETH, process.env.OP_KOVAN_TC_MARKET, process.env.OP_KOVAN_TC_BATHHOUSE, {gasLimit: 8999999}) .then(async function (g) {
  //       await btUInst.initialize("bathETH", process.env.OP_KOVAN_TC_ETH, process.env.OP_KOVAN_TC_MARKET, process.env.OP_KOVAN_TC_BATHHOUSE, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of Bath USDC success"));
  //   });
  // });

  // // Deploy bathETHUSDC
  // const bathPairFactory = await hre.ethers.getContractFactory("BathPair");
  //     const newBathPair = await bathPairFactory.deploy({nonce: getNonce()}).then(async function(r) {
  //             console.log("bathETH-USDC deployed at " + await r.address);
  //             const btUInst = await bathPairFactory.attach(await r.address);
  //             await btUInst.estimateGas.initialize(process.env['OP_KOVAN_TC_BATHETH'], process.env.OP_KOVAN_TC_BATHUSDC, process.env.OP_KOVAN_TC_BATHHOUSE, 500, -5, {gasLimit: 8999999}) .then(async function (g) {
  //               await btUInst.initialize(process.env['OP_KOVAN_TC_BATHETH'], process.env.OP_KOVAN_TC_BATHUSDC, process.env.OP_KOVAN_TC_BATHHOUSE, 500, -5, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bath ETH-USDC success"));
  //           });
  //     });

  // // Init bathETH
  //   const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_TC_BATHHOUSE);
  //   await bh.estimateGas.initBathPair(process.env['OP_KOVAN_TC_ETH'], process.env.OP_KOVAN_TC_USDC, process.env['OP_KOVAN_TC_BATHETHUSDC'], 5).then(async function(g) {
  //             await bh.initBathPair(process.env['OP_KOVAN_TC_ETH'], process.env.OP_KOVAN_TC_USDC, process.env['OP_KOVAN_TC_BATHETHUSDC'], 5, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bathETH-USDC success on BH"));
  //         });

  //   // set max ordersize bps on BathHouse
  //   for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_TC_BATHHOUSE);
  //   await bh.estimateGas.setBathPairMOSBPS(process.env['OP_KOVAN_TC_BATH'+asset+'USDC'], 25).then(async function(g) {
  //             await bh.setBathPairMOSBPS(process.env['OP_KOVAN_TC_BATH'+asset+'USDC'], 25,{gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("set max order size bps " + asset+ "-USDC success on BH"));
  //         });
    
  // }
  
  // // set BathHouse Variable
  //   const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_TC_BATHHOUSE);
  //   await bh.estimateGas.setCancelTimeDelay(86400).then(async function(g) {
  //             await bh.setCancelTimeDelay(86400,{gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("set time delay on BH"));
  //   });

    // // Whitelist a strategist
    // const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
    // const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_2_BATHHOUSE);
    // let newStrategist = process.env.OP_KOVAN_ADMIN;
    // await bh.estimateGas.approveStrategist(newStrategist).then(async function(g) {
    //           await bh.approveStrategist(newStrategist).then((r) => console.log("approved this strategist ", newStrategist));
    // });
    
  // // // set market Variable
  //   const bathHouseFactory = await hre.ethers.getContractFactory("RubiconMarket");
  //   const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_2_MARKET);
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
      // const proxyFactory = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
      // const newProxy = await proxyFactory.deploy(address, process.env.OP_KOVAN_PROXY_ADMIN,"0x",{nonce: await getNonce(), gasLimit: 82410000}).then(async function(r) {
      //               const inst = await proxyFactory.attach(await r.address);
      //               return await r.address;
      // });
      return await deploy('TransparentUpgradeableProxy', {
        from: deployer,
        log: true,
        gasLimit: 82410000,
        args: [address, process.env.OP_KOVAN_PROXY_ADMIN,"0x"],
        nonce: getNonce()
      }).then(async function(d) {
             console.log("Transparent Upgradeable Proxy deployed at: " + await d.address + " for " + msg + " " + address);
             return await d.address;
     });
    }
}
  

func.tags = ['Assets']
module.exports = func
