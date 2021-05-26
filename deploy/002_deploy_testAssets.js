const { BigNumber } = require("ethers");

require("dotenv").config();

// Deploy test assets for Kovan OP testnet
const func = async (hre) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

// WETH
  const WETHdeployResult = await deploy('WETH9', {
    from: deployer,
    log: true
     });
  if (WETHdeployResult.newlyDeployed) {
    console.log(
      `WETH deployed at ${WETHdeployResult.address}`
    );
}
// USDC
const USDCdeployResult = await deploy('DaiWithFaucet', {
    from: deployer,
    args: [69],
    log: true
     });
  if (USDCdeployResult.newlyDeployed) {
    console.log(
      `USDC deployed at ${USDCdeployResult.address}`
    );
}
    assetsToDeploy = [
    "WAYNE",
    "STARK",
    "GME",
    "OPT",
    "SPXE",
    "WBTC",
    "COIN"
  ];

    const deployResult = await deploy('EquityToken', {
        from: deployer,
        args: [process.env.OP_KOVAN_ADMIN, BigNumber.from("1000000000000000000000")],
        log: true
     });
    if (deployResult.newlyDeployed) {
     console.log(
       `contract WAYNE deployed at ${deployResult.address}`
    );
    }

}
  

func.tags = ['Assets']
module.exports = func