// import {HardhatRuntimeEnvironment} from 'hardhat/types';
// import {DeployFunction} from 'hardhat-deploy/types';

// Just a standard hardhat-deploy deployment definition file!
const func = async (hre) => {
    const { deployments, getNamedAccounts } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()
    console.log("deployer", deployer)

    await deploy('RubiconMarket', { 
      from: deployer,
      args: [],
      gasPrice: hre.ethers.BigNumber.from('0'),
      gasLimit: 8999999,
      log: true
    })
  }
  
  func.tags = ['RubiconMarket'] // Replace `ERC20` with your contract's file name
  module.exports = func