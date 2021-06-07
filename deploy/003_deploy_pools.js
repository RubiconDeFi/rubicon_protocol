require("dotenv").config();

// Deploy Rubicon Pools to Kovan OP
const func = async (hre) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

// -----------------------------------------------
  // Deploy and init Bath House
  const deployResultBH = await deploy('BathHouse', {
    from: deployer,
    log: true
  });
  if (deployResultBH.newlyDeployed) {
    console.log(
      `contract BathHouse deployed at ${deployResultBH.address}`
    );

    // Init BathHouse
        const bh = await hre.ethers.getContractFactory("BathHouse");
        const BHI = await bh.attach(deployResultBH.address);
        await BHI.estimateGas.initialize(process.env.OP_KOVAN_MARKET, 80, 259200, 10).then(async function(g) {
          // setTimeout(() => {}, 8000);
          
          await BHI.initialize(process.env.OP_KOVAN_MARKET, 80, 259200, 10, {gasLimit: g._hex}).then((r) => console.log("BH Init \n" + r));
          console.log('Bath House initialized');
        });
    }

    // If already deployed 
    // const bh = await hre.ethers.getContractFactory("BathHouse");
    // const BHI = await bh.attach("0xcFdee663d4a4520a69Ed5a6dE05a2e81365919fc");
    // await BHI.estimateGas.initialize(process.env.OP_KOVAN_MARKET, /*80,*/ 259200, 10).then(async function(g) {
    //   setTimeout(() => {}, 8000);
    //   console.log(g);
    //   await BHI.initialize(process.env.OP_KOVAN_MARKET, 80, 259200, 10, {gasLimit: g._hex}).then((r) => console.log("BH Init \n" + r));
    // });

// -----------------------------------------------
  // Deploy pairs trade
  const deployResultPT = await deploy('PairsTrade', {
    from: deployer,
    args: ["Pairs Trade", process.env.OP_KOVAN_BATHHOUSE, process.env.OP_KOVAN_MARKET],
    log: true
  });
  if (deployResultPT.newlyDeployed) {
    console.log(
      `contract Pairs Trade deployed at ${deployResultPT.address}`
    );

    }

// -----------------------------------------------
  // Deploy BathTokens
//   // Deploy BathToken for WAYNE
//   const bathTokenFactory = await hre.ethers.getContractFactory("BathToken");
//   const bathTokenWAYNE = await bathTokenFactory.deploy().then(async function(r) {
//     console.log("bathWAYNE deployed at " + r.address);
//     const btWAddr = r.address;
//     const btWInst = await bathTokenFactory.attach(r.address);
//     await btWInst.estimateGas.initialize("bathWAYNE", process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: 8999999}).then(async function (g) {
//       await btWInst.initialize("bathWAYNE", process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: g._hex}).then((r) => console.log("init of Bath token", r));
//   });
// });
      
// // Deploy BathToken for USDC
//      const bathTokenUSDC = await bathTokenFactory.deploy().then(async function(r) {
//       console.log("bathUSDC deployed at " + r.address);
//       const btUAddr = r.address;
//       const btUInst = await bathTokenFactory.attach(r.address);
//       await btUInst.estimateGas.initialize("bathUSDC", process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: 8999999}).then(async function (g) {
//         await btUInst.initialize("bathWAYNE", process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: g._hex}).then((r) => console.log("init of Bath token", r));
//     });
//   });
// -----------------------------------------------

  // Deploy BathPair for WAYNE / DAI
  const deployResultBP = await deploy('BathPair', {
    from: deployer,
    log: true,
    gasLimit: 9000000
  });
  if (deployResultBP.newlyDeployed) {
    console.log(
      `contract BathPair deployed at ${deployResultBP.address}`
    );

    // Load BathPair if not deployed
    const bp = await hre.ethers.getContractFactory("BathPair");
    const BPI = await bp.attach(deployResultBP.address);
    await BPI.initialize(process.env.OP_KOVAN_BATHWAYNE, process.env.OP_KOVAN_BATHUSDC,
        process.env.OP_KOVAN_BATHHOUSE, {gasLimit: 5000000}).then(async function(g) {
          console.log(g);
          // await BPI.initialize(process.env.OP_KOVAN_BATHWAYNE, process.env.OP_KOVAN_BATHUSDC,
          //   process.env.OP_KOVAN_BATHHOUSE, {gasLimit: g._hex}).then((r) => console.log("init of BP", r));
        });
  }
}

func.tags = ['Pools']
module.exports = func
