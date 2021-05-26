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
    log(
      `contract RubiconMarket deployed at ${deployResult.contract.address} using ${deployResult.receipt.gasUsed} gas`
    );
  }
  // const rubiconMarketInstance = await deployments.get('RubiconMarket');
  // console.log(rubiconMarketInstance);

  // Initialize Rubicon Market
  const rmi = await hre.ethers.getContractFactory("RubiconMarket");
  const RMI = await rmi.attach("0x5D0e5aa14399FDb06aC9fE6eAcE32ff259b70Ea0");
  await RMI.initialize(false, "0xC96495C314879586761d991a2B68ebeab12C03FE", {gasLimit: 8999999}).then((r ) => console.log(r));

}

func.tags = ['RubiconMarket']
module.exports = func
