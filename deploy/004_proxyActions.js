require("dotenv").config();

// Rubicon Market L2 Deploy and init
const func = async (hre) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, proxyAdmin } = await getNamedAccounts();

  const targetProxyAddress = process.env.OP_KOVAN_3_BATHHOUSE;
  const newImp = process.env.OP_KOVAN_3_BATHHOUSE_NEWIMP;


  const proxyFactory = await hre.ethers.getContractFactory(
    "TransparentUpgradeableProxy"
  );
  const bathPairFactory = await hre.ethers.getContractFactory(
    "BathPair"
  );
  const targetProxy = await proxyFactory.attach(targetProxyAddress);
  // const bpProxy = await bathPairFactory.attach(targetProxyAddress);

  const signers = hre.ethers.getSigners();

  //   ***** Perform actions *****
  await upgradeProxy(targetProxy, newImp, "BathHouse");
  // await getCurrentImplementation(targetProxy, "WBTC");
  // console.log(await current);


  async function upgradeProxy(contract, newImp, msg) {
    return contract
      .connect(signers[1])
      .estimateGas.upgradeTo(await newImp, { from: proxyAdmin })
      .then(async (g) => {
        await contract
          .connect(signers[1])
          .upgradeTo(await newImp, { from: proxyAdmin, gasLimit: g._hex })
          .then(async (g) => {
            console.log(
              "success changing implementation on ",
              targetProxyAddress,
              " to * newIMP * for ",
              await msg
            );
          });
      });
  }

  // TODO: make this work
  async function getCurrentImplementation(contract, msg) {
    await contract
      .connect(signers[1])
      .implementation({ from: proxyAdmin })
      .then((r) => {
        console.log(r);
      });
  }
  // return the address of the proxy that wraps `address`
  async function deployProxy(address, msg) {
    return await deploy("TransparentUpgradeableProxy", {
      from: deployer,
      log: true,
      gasLimit: 82410000,
      args: [address, process.env.OP_KOVAN_PROXY_ADMIN, "0x"],
      nonce: getNonce(),
    }).then(async function (d) {
      console.log(
        "Transparent Upgradeable Proxy deployed at: " +
          (await d.address) +
          " for " +
          msg +
          " " +
          address
      );
      return await d.address;
    });
  }
};

func.tags = ["RubiconMarket"];
module.exports = func;
