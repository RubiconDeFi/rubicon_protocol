// require("dotenv").config();
// const Web3 = require('web3');

// // Deploy Rubicon Pools to Kovan OP
// const func = async (hre) => {
//   const { deployments, getNamedAccounts } = hre
//   const { deploy } = deployments
//   const { deployer } = await getNamedAccounts()

//   // The below may need to be done incrementally in single runs
// // -----------------------------------------------
// // Proxy info: https://github.com/wighawag/hardhat-deploy#deploying-and-upgrading-proxies
//   //1. Deploy and init Bath House
//   const deployResultBH = await deploy('TransparentUpgradeableProxy', {
//     from: deployer,
//     log: true,
//     args: [process.env.OP_KOVAN_BATHHOUSE, process.env.OP_KOVAN_ADMIN, Web3.utils.asciiToHex("4ec81af1000000000000000000000000f0f43c664c5305c4683c7c2212befe89905ae4910000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000003f480000000000000000000000000000000000000000000000000000000000000000a")],
//     gasLimit: 8000000 
//   })
//  // 2 Launch Bath Tokens

// }

// func.tags = ['Pools']
// module.exports = func
