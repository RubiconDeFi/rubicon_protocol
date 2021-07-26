require("dotenv").config();

// Rubicon Market L2 Deploy and init
const func = async (hre) => {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer, proxyAdmin } = await getNamedAccounts()
  
  const targetProxyAddress = process.env.OP_KOVAN_2_BATHWBTCUSDC;
  const newImp = process.env.OP_KOVAN_2_BATHWBTCUSDC_2_NOINIT;
  console.log("target newImp: ", newImp);

  const proxyFactory = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
  const targetProxy = await proxyFactory.attach(targetProxyAddress);
  const signers = hre.ethers.getSigners(); 

//   Perform actions
//   await upgradeProxy(targetProxy, newImp, "WBTC");
  const current = await getCurrentImplementation(targetProxy, "WBTC");
  console.log("current", current);


  async function upgradeProxy(contract, newImp, msg) {
      return contract.connect(signers[1]).estimateGas.upgradeTo(await newImp, {from: proxyAdmin}).then(async (g) => {
        await contract.connect(signers[1]).upgradeTo(await newImp, {from: proxyAdmin, gasLimit: g._hex}).then(async (g) => { 
            console.log("success changing implementation from ", targetProxyAddress, " to * newIMP * for ", await msg);
        });
      });
  }

  async function getCurrentImplementation(contract, msg) {
      return await contract.connect(signers[1]).implementation();
    }
    // return the address of the proxy that wraps `address` 
  async function deployProxy(address, msg) {
    return await deploy('TransparentUpgradeableProxy', {
        from: deployer,
        log: true,
        gasLimit: 82410000,
        args: [address, process.env.OP_KOVAN_PROXY_ADMIN,"0x"],
        nonce: getNonce()
      }).then(async function(d) {
             console.log("Transparent Upgradeable Proxy deployed at: " + await d.address + " for " + msg + " " + address);
             return await d.address;
     });
    }
  

}

func.tags = ['RubiconMarket']
module.exports = func