require("dotenv").config();
const { LedgerSigner } = require("@ethersproject/hardware-wallets");

// Rubicon Market L2 Deploy and init
const func = async (hre) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, proxyAdmin } = await getNamedAccounts();

  // const targetProxyAddress = process.env.OP_KOVAN_3_BATHHOUSE;

  const assetsToDeploy = [
    // "WBTC",
    "MKR",
    "SNX",
    "REP",
    "RGT",
    "OHM",
    "COMP",
    "AAVE",
    "ETH",
    //"USDC" //*
  ];

  // ** HD Wallet Support **
  const provider = new hre.ethers.providers.JsonRpcProvider(
    "https://optimism-kovan.infura.io/v3/" + process.env.INFURA_API_KEY
  );
  const type = "hid";
  const path_1 = `m/44'/60'/1'/0/0`; //account 1

  const proxyAddress = process.env.CORP_HD_ACCOUNT_1;

  // // Note: can only have one at a time
  // const HD_proxyAdmin = new LedgerSigner(provider, type, path_1);
  // const HD_proxyAdmin_Addr = await HD_proxyAdmin.getAddress();
  // if (HD_proxyAdmin_Addr == proxyAddress) {
  //   // nothing 
  // } else {
  //   console.log("HD Deployer, Proxy Admin Address is incorrect**");
  // }


  const proxyFactory = await hre.ethers.getContractFactory(
    "TransparentUpgradeableProxy"
  );
  const bathPairFactory = await hre.ethers.getContractFactory("BathPair");
  // const targetProxy = await proxyFactory.attach(targetProxyAddress);
  // const bpProxy = await bathPairFactory.attach(targetProxyAddress);

  // const signers = hre.ethers.getSigners();

  // *** Nonce Manager ***
  let baseNonce = web3.eth.getTransactionCount(proxyAddress);
  let nonceOffset = 0;
  function getNonce() {
    return baseNonce.then((nonce) => nonce + nonceOffset++);
  }


  //   ***** Perform actions *****
  // TODO: get this working
  // await getCurrentImplementation(targetProxy, "WBTC");
  // console.log(await current);

  // await upgradeProxy(await proxyFactory.attach(
  //         process.env.OP_KOVAN_4_BATHREPUSDC
  //       ), process.env.OP_KOVAN_4_BATHREPUSDC_NEWIMP, "bathREPUSDC");

  // for (let index = 0; index < assetsToDeploy.length; index++) {
  //   const element = await assetsToDeploy[index];
  //   await upgradeProxy(
  //     await proxyFactory.attach(
  //       process.env["OP_KOVAN_3_BATH" + (await element) + "USDC"]
  //     ),
  //     process.env["OP_KOVAN_3_BATH" + element + "USDC_NEWIMP"],
  //     "bath" + element + "USDC"
  //   );
  // }

  async function upgradeProxy(contract, newImp, msg) {
    return contract
      .connect(HD_proxyAdmin)
      .estimateGas.upgradeTo(await newImp, { from: HD_proxyAdmin_Addr })
      .then(async (g) => {
        await contract
          .connect(HD_proxyAdmin)
          .upgradeTo(await newImp, {
            from: HD_proxyAdmin_Addr,
            gasLimit: g._hex,
            nonce: getNonce(),
          })
          .then(async (g) => {
            console.log(
              "success changing implementation on ",
              // contract.address,
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
      .implementation({ from: HD_proxyAdmin_Addr })
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

func.tags = ["Proxies"];
module.exports = func;
