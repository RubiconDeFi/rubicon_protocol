require("dotenv").config();

// Deploy Rubicon Pools to Kovan OP
const func = async (hre) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  // Deploy and init Bath House
  const deployResultBH = await deploy('BathHouse', {
    from: deployer,
    log: true
  });
  if (deployResultBH.newlyDeployed) {
    console.log(
      `contract BathHouse deployed at ${deployResultBH.address}`
    );

    // // Init BathHouse
      // If already deployed 
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

  setTimeout(() => {}, 8000);
  // Deploy BathToken for WAYNE
  const bathTokenFactory = await hre.ethers.getContractFactory("BathToken");
  const bathTokenWAYNE = await bathTokenFactory.deploy().then((r) => console.log(r));
  // await bathTokenWAYNE.initialize("bathWAYNE", process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: 8999999}).then((r ) => console.log("BathWAYNE deployed and init \n" + r));
    
  setTimeout(() => {}, 8000);
     // Deploy BathToken for USDC
  const bathTokenUSDC = await bathTokenFactory.deploy().then((r) => console.log(r));
  // await bathTokenUSDC.initialize("bathUSDC", process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: 8999999}).then((r ) => console.log("BathUSDC deployed and init \n" +r));
 

  // const deployResultBtW = await deploy('BathToken', {
  //   from: deployer,
  //   log: true,
  //   gasLimit: 9000000
  // });
  // if (deployResultBP.newlyDeployed) {
  //   console.log(
  //     `contract BathPair deployed at ${deployResultBP.address}`
  //   );

  //       // Load BathPair if not deployed
  //       const bp = await hre.ethers.getContractFactory("BathPair");
  //       const BPI = await bp.attach(deployResultBP.address);
  //       await BPI.initialize(bathAssetAddr, bathQuoteAddr,
  //           BHI.address, {gasLimit: 8999999}).then((r ) => console.log(r));
  // }


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
        await BPI.initialize(bathTokenWAYNE.address, bathTokenUSDC.address,
            BHI.address, {gasLimit: 8999999}).then((r ) => console.log(r));
  }
}

func.tags = ['Pools']
module.exports = func
