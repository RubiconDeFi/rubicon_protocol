const Web3 = require("web3");

require("dotenv").config();

// Deploy Rubicon Pools to Kovan OP
const func = async (hre) => {
  // ****************************************************************************
  const { deployments, getNamedAccounts, web3 } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  // The below may need to be done incrementally in single runs
// -----------------------------------------------
// Proxy info: https://github.com/wighawag/hardhat-deploy#deploying-and-upgrading-proxies
    // Get current nonce
    let baseNonce = web3.eth.getTransactionCount(process.env.OP_KOVAN_ADMIN);
    let nonceOffset = 0;
    function getNonce() {
      return baseNonce.then((nonce) => (nonce + (nonceOffset++)));
    }
    // console.log('Current Nonce', web3.eth.getTransactionCount(process.env.OP_KOVAN_ADMIN).then((r) => {console.log("trans count", r)}));
//1. Deploy and init Bath House
  const deployResultBH = await deploy('BathHouse', {
    from: deployer,
    log: true,
    // proxy: {
    //     methodName: 'initialize',
    //     // owner: process.env.OP_KOVAN_MULTISIG
    //     proxyContract: 'TransparentUpgradeableProxy'
    // },
    // args: [process.env.OP_KOVAN_MARKET, 80, 259200, 10],
    gasLimit: 69180000,
    nonce: getNonce()
  }).then(async function(d) {
    const newBHAddr = await d.address;
    console.log(`bathHouse is at ${newBHAddr}`);
    if (await d.newlyDeployed) {
    console.log(
      `contract BathHouse deployed at ${newBHAddr}`
    );

    // Init BathHouse
        const bh = await hre.ethers.getContractFactory("BathHouse");
        const BHI = await bh.attach(newBHAddr);
        await BHI.estimateGas.initialize(process.env.OP_KOVAN_TC_MARKET, 80, 259200, 10).then(async function(g) {
          setTimeout(() => {}, 2000);
          await BHI.initialize(process.env.OP_KOVAN_TC_MARKET, 80, 259200, 10, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("BH Init Call sent!\n"));
        });
      return await newBHAddr;
} else {
  return process.env.OP_KOVAN_BATHHOUSE;
} // 2 Launch Bath Tokens
});
// .then(async function(newBHAddr) {
//       // Deploy BathTokens
//   // Deploy BathToken for WAYNE
//   const bathTokenFactory = await hre.ethers.getContractFactory("BathToken");
//   const bathWAYNEAddr = await bathTokenFactory.deploy({nonce: getNonce()}).then(async function(r) {
//     console.log("bathWAYNE deployed at " + await r.address);
//     const btWInst = await bathTokenFactory.attach(await r.address);
//     await btWInst.estimateGas.initialize("bathWAYNE", process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_MARKET, await newBHAddr, {gasLimit: 8999999}).then(async function (g) {
//       await btWInst.initialize("bathWAYNE", process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_MARKET, await newBHAddr, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of Bath WAYNE success"));
//   });
//   return await r.address;
// });
      
// // // Deploy BathToken for USDC
//      const bathTokenFactoryUSDC = await hre.ethers.getContractFactory('BathToken');
//      const bathUSDCAddr = await bathTokenFactoryUSDC.deploy({nonce: getNonce()}).then(async function(r) {
//       console.log("bathUSDC deployed at " + await r.address);
//       const btUInst = await bathTokenFactoryUSDC.attach(await r.address);
//       await btUInst.estimateGas.initialize("bathUSDC", process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_MARKET, await newBHAddr, {gasLimit: 8999999}) .then(async function (g) {
//         await btUInst.initialize("bathUSDC", process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_MARKET, await newBHAddr, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("init of Bath USDC success"));
//     });
//     return await r.address;
//   });
//   return [await bathWAYNEAddr, await bathUSDCAddr, await newBHAddr];
// }).then(async function(array) {
//   const wA = array[0];
//   const uA = array[1];
//   const bh = array[2];
//    // Deploy BathPair for WAYNE / DAI
//   const deployResultBP = await deploy('BathPair', {
//     from: deployer,
//     log: true,
//     gasLimit: 203210000,
//     nonce: getNonce()
//   });
//   if (deployResultBP.newlyDeployed) {
//     console.log(
//       `contract BathPair deployed at ${deployResultBP.address}`
//     );

//     const bp = await hre.ethers.getContractFactory("BathPair");
//     const BPI = await bp.attach(deployResultBP.address);
//     await BPI.initialize(await wA, await uA,
//         await bh, 500, -5, {gasLimit: 5180000, nonce: getNonce()}).then(async function(g) {
//           console.log("bathPair Initialized!");
//           // await BPI.initialize(process.env.OP_KOVAN_BATHWAYNE, process.env.OP_KOVAN_BATHUSDC,
//           //   process.env.OP_KOVAN_BATHHOUSE, {gasLimit: g._hex}).then((r) => console.log("init of BP", r));
//         });
//     return [wA, uA, bh, await deployResultBP.address];
//   } else {
//     return [wA, uA, bh, process.env.OP_KOVAN_BATHWAYNEUSDC];
//   }
// }).then(async function(data) {
//           // 4. Deploy pairs trade
//   const deployResultPT = await deploy('PairsTrade', {
//     from: deployer,
//     args: ["Pairs Trade", data[2], process.env.OP_KOVAN_MARKET],
//     log: true,
//     nonce: getNonce()
//   });
//   if (await deployResultPT.newlyDeployed) {
//     console.log(
//       `contract Pairs Trade deployed at ${await deployResultPT.address}`
//     );
//     data.push(await deployResultPT.address);
//     return data;
//     }
//   else {
//     data.push(process.env.OP_KOVAN_PAIRSTRADE);
//     return data;
//   }
// }).then(async function(data) {
//       //5. Approve the Pairs Trade strategy
//     const bh = await hre.ethers.getContractFactory("BathHouse");
//     const BHI = await bh.attach(await data[2]);
//     // await BHI.estimateGas.approveStrategy(await data[4]).then(async function(g) {
//       await BHI.approveStrategy(await data[4], {gasLimit: 9000000, nonce: getNonce()}).then((r) => console.log("Pairs Trade approve call made \n"));
//       // console.log('Pairs Trade Approved');
//     // );
//     return data;
// }).then(async function(data) {
//     // // 6. Approve the WAYNE/USDC bath pair
//     const bh = await hre.ethers.getContractFactory("BathHouse");
//     const BHI = await bh.attach(data[2]);
//     // await BHI.estimateGas.initBathPair(process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_BATHWAYNEUSDC, 5).then(async function(g) {
//       await BHI.initBathPair(process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_USDC, data[3], 5, {gasLimit:  5000000, nonce: getNonce()}).then(async function(r) {
//         console.log("initBathPair success");
//       });
// });
// //  **************************************************************************************************


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
      
// // // Deploy BathToken for USDC
//      const bathTokenFactoryUSDC = await hre.ethers.getContractFactory('BathToken');
//      const bathTokenUSDC = await bathTokenFactoryUSDC.deploy().then(async function(r) {
//       console.log("bathUSDC deployed at " + await r.address);
//       const btUInst = await bathTokenFactoryUSDC.attach(await r.address);
//       await btUInst.estimateGas.initialize("bathUSDC", process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: 8999999}) .then(async function (g) {
//         await btUInst.initialize("bathUSDC", process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_MARKET, process.env.OP_KOVAN_BATHHOUSE, {gasLimit: g._hex}).then((r) => console.log("init of Bath USDC success"));
//     });
//   });
// --------------------------------------------------------------------------
  //   // 3. deploy BathPair and init
    
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

      // 4. Deploy pairs trade
  const deployResultPT = await deploy('PairsTrade', {
    from: deployer,
    args: ["Pools Trade Library", process.env.OP_KOVAN_TC_BATHHOUSE, process.env.OP_KOVAN_TC_MARKET],
    log: true
  });
  if (deployResultPT.newlyDeployed) {
    console.log(
      `contract Pairs Trade deployed at ${deployResultPT.address}`
    );
        //5. Approve the Pairs Trade strategy
    const bh = await hre.ethers.getContractFactory("BathHouse");
    const BHI = await bh.attach(process.env.OP_KOVAN_TC_BATHHOUSE);
    await BHI.estimateGas.approveStrategy(deployResultPT.address).then(async function(g) {
      await BHI.approveStrategy(deployResultPT.address, {gasLimit: g._hex, nonce: getNonce()}).then((r) => console.log("PairsTrade approved \n" + r));
      console.log('Pairs Trade Approved');
    });
    }



    // // // 6. Approve the WAYNE/USDC bath pair
    // const bh = await hre.ethers.getContractFactory("BathHouse");
    // const BHI = await bh.attach(process.env.OP_KOVAN_BATHHOUSE);
    // // await BHI.estimateGas.initBathPair(process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_BATHWAYNEUSDC, 5).then(async function(g) {
    //   await BHI.initBathPair(process.env.OP_KOVAN_WAYNE, process.env.OP_KOVAN_USDC, process.env.OP_KOVAN_BATHWAYNEUSDC, 5, {gasLimit:  5000000}).then(async function(r) {
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
