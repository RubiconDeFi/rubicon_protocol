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

//1. Deploy and init Bath House
const deployResultBH = await deploy('BathHouse', {
  from: deployer,
  log: true,
  gasLimit: 135990000,
  nonce: getNonce()
}).then(async function(d) {
  const newBHAddr = await d.address;
  console.log(`bathHouse is at ${newBHAddr}`);
  if (await d.newlyDeployed) {
  console.log(
    `contract BathHouse deployed at ${newBHAddr}`
  );

  // Init BathHouse
      const bh = await hre.ethers.getContractFactory("BathHouse");
      const BHI = await bh.attach(newBHAddr);
      await BHI.estimateGas.initialize(process.env.OP_KOVAN_TC_MARKET, 80, 259200, 10).then(async function(g) {
        await BHI.initialize(process.env.OP_KOVAN_TC_MARKET, 80, 259200, 10, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("BH Init Call sent!\n"));
        return newBHAddr;          
      }).then(async (addr) => {await deployProxy(addr, "bathHouse")});
}
});
  // ****************************
  // const USDCFactory = await hre.ethers.getContractFactory("DaiWithFaucet");
  // await USDCFactory.deploy(69, process.env.OP_KOVAN_ADMIN, "USDC", "USDC", {gasLimit: 114380000, nonce: getNonce()}).then((r) => {console.log("deployed new USDC at ", r.address)})

  const assetsToDeploy = [
    "WBTC",
    "MKR",
    "SNX",
    "REP",
    "RGT"
    // "USDC" //*
  ];

  // // deploy contracts
  // for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const asset = assetsToDeploy[index];
  //   const TokenFactory = await hre.ethers.getContractFactory("EquityToken");
  //   await TokenFactory.deploy(process.env.OP_KOVAN_ADMIN, web3.utils.toWei("1000000"), asset, asset, {nonce:getNonce()}).then(async function(r) {
  //     console.log(asset + " deployed at " + await r.address);
  //   return await r.address;
  //   });
    
  // }

//   // deploy BathTokens
//   for (let index = 0; index < assetsToDeploy.length; index++) {
//     const asset = assetsToDeploy[index];
//     const bathTokenFactory = await hre.ethers.getContractFactory("BathToken");
//     const newBathToken = await bathTokenFactory.deploy({nonce: getNonce()}).then(async function(r) {
//             console.log("bath" + asset +  " deployed at " + await r.address);
//             const btUInst = await bathTokenFactory.attach(await r.address);
//             await btUInst.estimateGas.initialize("bath" + asset, process.env['OP_KOVAN_TC_'+asset], process.env.OP_KOVAN_TC_MARKET, process.env.OP_KOVAN_TC_BATHHOUSE, {gasLimit: 8999999}) .then(async function (g) {
//               await btUInst.initialize("bath" + asset, process.env['OP_KOVAN_TC_'+asset], process.env.OP_KOVAN_TC_MARKET, process.env.OP_KOVAN_TC_BATHHOUSE, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bath" + asset+ " success"));
//               return r.address;
//     }).then(async (addr) => {await deployProxy(addr, "bath" + asset)})
//     // await deployProxy(, "bath" + asset)
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
  
  // set BathHouse Variable
    // const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
    // const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_TC_BATHHOUSE);
    // await bh.estimateGas.setCancelTimeDelay(86400).then(async function(g) {
    //           await bh.setCancelTimeDelay(86400,{gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("set time delay on BH"));
    // });


  // ************** Proxies ***********************
    
    // Deploy TransparentUpgradeableProxy
    // return the address of the proxy that wraps `address` 
    async function deployProxy(address, msg) {
      const proxyFactory = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
      const newProxy = await proxyFactory.deploy(address, process.env.OP_KOVAN_PROXY_ADMIN,0,{nonce: await getNonce(), gasLimit: 82410000}).then(async function(r) {
                    console.log("Transparent Upgradeable Proxy deployed at: " + await r.address + " for " + msg);
                    const inst = await proxyFactory.attach(await r.address);
                    return await r.address;
      });
    }

    // async function updateProxy(address, msg) {

    // }

}
  

func.tags = ['Assets']
module.exports = func
