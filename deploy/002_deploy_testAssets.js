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

//   // WETH
//   const WETHdeployResult = await deploy('WETH9', {
//     from: deployer,
//     log: true
//      });
//   if (WETHdeployResult.newlyDeployed) {
//     console.log(
//       `WETH deployed at ${WETHdeployResult.address}`
//     );
// }
// USDC
// const USDCdeployResult = await deploy('DaiWithFaucet', {
//     from: deployer,
//     args: [69],
//     log: true,
//     gasLimit: 60050000,
//     nonce: getNonce()
//      });
//   if (USDCdeployResult.newlyDeployed) {
//     console.log(
//       `USDC deployed at ${USDCdeployResult.address}`
//     );
//   }
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
//           });
    
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

  // Approve BathPairs on BathHouse
    for (let index = 0; index < assetsToDeploy.length; index++) {
    const asset = assetsToDeploy[index];
    const bathHouseFactory = await hre.ethers.getContractFactory("BathHouse");
    const bh = await bathHouseFactory.attach(process.env.OP_KOVAN_TC_BATHHOUSE);
    await bh.estimateGas.initBathPair(process.env['OP_KOVAN_TC_'+asset], process.env.OP_KOVAN_TC_USDC, process.env['OP_KOVAN_TC_BATH'+asset+'USDC'], 5).then(async function(g) {
              await bh.initBathPair(process.env['OP_KOVAN_TC_'+asset], process.env.OP_KOVAN_TC_USDC, process.env['OP_KOVAN_TC_BATH'+asset+'USDC'], 5, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of bath" + asset+ "-USDC success on BH"));
          });
    
  }

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
  // *************************************


  //   const deployResult = await deploy('EquityToken', {
  //       from: deployer,
  //       args: [process.env.OP_KOVAN_ADMIN, BigNumber.from("1000000000000000000000")],
  //       log: true
  //    });
  //   if (deployResult.newlyDeployed) {
  //    console.log(
  //      `contract WAYNE deployed at ${deployResult.address}`
  //   );

}
  

func.tags = ['Assets']
module.exports = func
