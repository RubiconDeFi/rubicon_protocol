require("dotenv").config();

// Deploy Rubicon Pools to Kovan OP
const func = async (hre) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  // The below may need to be done incrementally in single runs
// -----------------------------------------------
//   //1. Deploy and init Bath House
//   const deployResultBH = await deploy('BathHouse', {
//     from: deployer,
//     log: true
//   });
//   if (deployResultBH.newlyDeployed) {
//     console.log(
//       `contract BathHouse deployed at ${deployResultBH.address}`
//     );

//     // Init BathHouse
//         const bh = await hre.ethers.getContractFactory("BathHouse");
//         const BHI = await bh.attach(deployResultBH.address);
//         await BHI.estimateGas.initialize(process.env.OP_KOVAN_MARKET, 80, 259200, 10).then(async function(g) {
//           // setTimeout(() => {}, 8000);
//           await BHI.initialize(process.env.OP_KOVAN_MARKET, 80, 259200, 10, {gasLimit: g._hex}).then((r) => console.log("BH Init \n" + r));
//           console.log('Bath House initialized');
//         });
//     }

//     // 2. ------------------------------
//   // Deploy BathTokens
//   // Deploy BathToken for WAYNE
//   const bathTokenFactory = await hre.ethers.getContractFactory("BathToken");
//   const bathTokenWAYNE = await bathTokenFactory.deploy().then(async function(r) {
//     console.log("bathWAYNE deployed at " + await r.address);
//     const btWInst = await bathTokenFactory.attach(await r.address);
//     await btWInst.estimateGas.initialize("bathWAYNE", process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: 8999999}).then(async function (g) {
//       await btWInst.initialize("bathWAYNE", process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: g._hex}).then((r) => console.log("init of Bath WAYNE success"));
//   });
// });
      
// // Deploy BathToken for USDC
//      const bathTokenFactoryUSDC = await hre.ethers.getContractFactory('BathToken');
//      const bathTokenUSDC = await bathTokenFactoryUSDC.deploy().then(async function(r) {
//       console.log("bathUSDC deployed at " + await r.address);
//       const btUInst = await bathTokenFactoryUSDC.attach(await r.address);
//       await btUInst.estimateGas.initialize("bathUSDC", process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: 8999999}) .then(async function (g) {
//         await btUInst.initialize("bathUSDC", process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: g._hex}).then((r) => console.log("init of Bath USDC success"));
//     });
//   });
// --------------------------------------------------------------------------
    // 3. deploy BathPair and init
    
  // // Deploy BathPair for WAYNE / DAI
  // const deployResultBP = await deploy('BathPair', {
  //   from: deployer,
  //   log: true,
  //   gasLimit: 9000000
  // });
  // if (deployResultBP.newlyDeployed) {
  //   console.log(
  //     `contract BathPair deployed at ${deployResultBP.address}`
  //   );

  //   const bp = await hre.ethers.getContractFactory("BathPair");
  //   const BPI = await bp.attach(deployResultBP.address);
  //   await BPI.initialize(process.env.OP_KOVAN_BATHWAYNE, process.env.OP_KOVAN_BATHUSDC,
  //       process.env.OP_KOVAN_BATHHOUSE, {gasLimit: 5000000}).then(async function(g) {
  //         console.log("init of BP", g);
  //         // await BPI.initialize(process.env.OP_KOVAN_BATHWAYNE, process.env.OP_KOVAN_BATHUSDC,
  //         //   process.env.OP_KOVAN_BATHHOUSE, {gasLimit: g._hex}).then((r) => console.log("init of BP", r));
  //       });
  // }

    // Load BathPair if  deployed
    // // // for initialization ensure the bath Tokens are initialized
    // const bp = await hre.ethers.getContractFactory("BathPair");
    // const BPI = await bp.attach(process.env.OP_KOVAN_BATHWAYNEUSDC);
    // await BPI.initialize(process.env.OP_KOVAN_BATHWAYNE, process.env.OP_KOVAN_BATHUSDC,
    //     process.env.OP_KOVAN_BATHHOUSE, {gasLimit: 5000000}).then(async function(g) {
    //       console.log(g);
    //       // await BPI.initialize(process.env.OP_KOVAN_BATHWAYNE, process.env.OP_KOVAN_BATHUSDC,
    //       //   process.env.OP_KOVAN_BATHHOUSE, {gasLimit: g._hex}).then((r) => console.log("init of BP", r));
    //     });
    // ---------------------------------------------------------------------

  //     // 4. Deploy pairs trade
  // const deployResultPT = await deploy('PairsTrade', {
  //   from: deployer,
  //   args: ["Pairs Trade", process.env.OP_KOVAN_BATHHOUSE, process.env.OP_KOVAN_MARKET],
  //   log: true
  // });
  // if (deployResultPT.newlyDeployed) {
  //   console.log(
  //     `contract Pairs Trade deployed at ${deployResultPT.address}`
  //   );

  //   }
    // //5. Approve the Pairs Trade strategy
    // const bh = await hre.ethers.getContractFactory("BathHouse");
    // const BHI = await bh.attach(process.env.OP_KOVAN_BATHHOUSE);
    // await BHI.estimateGas.approveStrategy(process.env.OP_KOVAN_PAIRSTRADE).then(async function(g) {
    //   await BHI.approveStrategy(process.env.OP_KOVAN_PAIRSTRADE, {gasLimit: g._hex}).then((r) => console.log("BH Init \n" + r));
    //   console.log('Pairs Trade Approved');
    // });

    // // // 6. Approve the WAYNE/USDC bath pair
    // const bh = await hre.ethers.getContractFactory("BathHouse");
    // const BHI = await bh.attach(process.env.OP_KOVAN_BATHHOUSE);
    // // await BHI.estimateGas.initBathPair(process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_BATHWAYNEUSDC).then(async function(g) {
    //   await BHI.initBathPair(process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_BATHWAYNEUSDC, {gasLimit:  5000000}).then(async function(r) {
    //     console.log("initBathPair result: ", r)
    //   });

    //  // // 6. Un-Approve a bath pair
    //  const bh = await hre.ethers.getContractFactory("BathHouse");
    //  const BHI = await bh.attach(process.env.OP_KOVAN_BATHHOUSE);
    //  // await BHI.estimateGas.initBathPair(process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_BATHWAYNEUSDC).then(async function(g) {
    //    await BHI.removePair("0xd8A569Bfeb0306dD45fDE6e7A880EAb550a7A143", {gasLimit:  5000000}).then(async function(r) {
    //      console.log("initBathPair result: ", r)
    //    });


}

func.tags = ['Pools']
module.exports = func