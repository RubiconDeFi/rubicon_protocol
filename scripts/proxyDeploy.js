// scripts/deploy.js
async function main() {
    console.log("Attempting proxy deploy...");
    // testing proxy and bathHouse
    const BathHouse = await hre.ethers.getContractFactory("BathHouse");
    const TransparentUpgradeableProxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");

    const bathHouse = await hre.upgrades.deployProxy(BathHouse, [process.env.OP_KOVAN_MARKET, 80, 259200, 10]);
    await bathHouse.deployed();
    console.log("Bath House deployed to: ", bathHouse.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });