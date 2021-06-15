require("dotenv").config();

import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-deploy'
import '@eth-optimism/hardhat-ovm'
import '@openzeppelin/hardhat-upgrades'

module.exports = {
  ovm: {
    solcVersion: "0.5.16"
  },
  solidity: {
    compilers: [
      {    
    version:"0.5.16",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
        },
      }
      },
      {version:"0.7.0"}
    ]

  },
  paths: {
    tests: "./ovm/ovmTests"
  },
  networks: {
    // https://community.optimism.io/docs/developers/integration.html#using-the-optimism-repo
      optimismLocal: {
        url: 'http://127.0.0.1:8545',
        accounts: {
          mnemonic: 'test test test test test test test test test test test junk'
        },
        ovm: true,
        gasPrice: 0,
      },
      optimismKovan: {
        url: 'https://kovan.optimism.io',
        ovm: true,
        gasPrice: 0,
        chainId: 69,
        accounts: [process.env.PRIVATE_KEY_KOVAN],
        gasLimit: 9000000,
        timeout: 4000
      }
  },
  // etherscan: {
  //   // Your API key for Etherscan
  //   // Obtain one at https://etherscan.io/
  //   apiKey: process.env.ETHERSCAN_API
  // },
  namedAccounts: {
    deployer: {
      default: 0
    }
  }
};

