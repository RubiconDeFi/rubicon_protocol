require("dotenv").config();

// Deploy Rubicon Pools to Kovan OP
const func = async (hre) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const deployResult = await deploy('BathHouse', {
    from: deployer,
    log: true
  });
  if (deployResult.newlyDeployed) {
    console.log(
      `contract BathHouse deployed at ${deployResult.address}`
    );
  }

  // Load Existing network contracts
    const WayneI = await hre.ethers.getContractFactory("EquityToken");
    const WI = await WayneI.attach("0x48D324c92716dd6a465650A4295c3E30AC21BB62");
    const USDCI = await hre.ethers.getContractFactory("DaiWithFaucet");
    const UI = await USDCI.attach("0x1147b3F6Eca313a5B3C2aA3Fb85928104a5787D3");
    const rmi = await hre.ethers.getContractFactory("RubiconMarket");
    const RMI = await rmi.attach("0x619beC3E00849e48112B162fDa1A6b1f8BC9d18F");
    
    const bh = await hre.ethers.getContractFactory("BathHouse");
    const BHI = await bh.attach(deployResult.address);

    // Deploy BathPair for WAYNE / DAI
  const deployResultBP = await deploy('BathPair', {
    from: deployer,
    // args: [      
    //   WI.address,
    //   "WAYNE",
    //   UI.address,
    //   "DAI",
    //   RMI.address,
    //   90,
    //   259200,
    //   10,
    //   BHI.address],
    log: true,
    gasLimit: 9000000
  });
  if (deployResultBP.newlyDeployed) {
    console.log(
      `contract BathPair deployed at ${deployResultBP.address}`
    );

        // Load BathPair if not deployed
        const bp = await hre.ethers.getContractFactory("BathPair");
        const BPI = await bp.attach(deployResult.address);
        await BPI.initialize(WI.address,
            "WAYNE",
            UI.address,
            "DAI",
            RMI.address,
            90,
            259200,
            10,
            BHI.address, {gasLimit: 8999999}).then((r ) => console.log(r));
        const bathQuote = await BPI.getThisBathQuote();
        const bathAsset = await BPI.getThisBathAsset();
        // ** initBath pair on bathhouse....
        console.log('New bathQuote at: ', bathQuote);
        console.log('New bathAsset at: ', bathAsset);
}
  
}

func.tags = ['Pools']
module.exports = func
