require("dotenv").config();

// Rubicon Market L2 Deploy and init
const func = async (hre) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const deployResult = await deploy('RubiconMarket', {
    from: deployer,
    log: true
  });
  if (deployResult.newlyDeployed) {
    console.log(
      `contract RubiconMarket deployed at ${deployResult.address}`
    );

    // Initialize Rubicon Market
    const rmi = await hre.ethers.getContractFactory("RubiconMarket");
    const RMI = await rmi.attach(deployResult.address);
    await RMI.initialize(false, process.env.OP_KOVAN_ADMIN, {gasLimit: 8999999}).then((r ) => console.log(r));
  }
  // const rubiconMarketInstance = await deployments.get('RubiconMarket');
  // console.log(rubiconMarketInstance);

}

func.tags = ['RubiconMarket']
module.exports = func
