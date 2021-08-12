require("dotenv").config();

// Rubicon Market L2 Deploy and init
const func = async (hre) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // // Uncomment the below block for deployment ***
  // const deployResult = await deploy('RubiconMarket', {
  //   from: deployer,
  //   log: true
  // });
  // if (deployResult.newlyDeployed) {
  //   console.log(
  //     `contract RubiconMarket deployed at ${deployResult.address}`
  //   );
  //   // Initialize Rubicon Market
  //   const rmi = await hre.ethers.getContractFactory("RubiconMarket");
  //   const RMI = await rmi.attach(deployResult.address);
  //   await RMI.initialize(false, process.env.OP_KOVAN_TC_FEE_RECIPIENT).then((r ) => console.log("Initialized Rubicon Market"));
  // }

  // Initialize Rubicon Market
  // const rmi = await hre.ethers.getContractFactory("RubiconMarket");
  // const RMI = await rmi.attach("0x09562e0C3694a25FB8cBFAC23f6c6161c24F2C42");
  // await RMI.estimateGas.initialize(false, process.env.OP_KOVAN_ADMIN, {gasLimit: 8099999}).then(async function(r) {
  //   await RMI.initialize(false, process.env.OP_KOVAN_ADMIN, {gasLimit: r._hex}).then((r1 ) => {
  //     console.log(r1);
  //   });
  // });
};

func.tags = ["RubiconMarket"];
module.exports = func;
