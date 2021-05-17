import { HardhatUserConfig } from 'hardhat/types'

import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@eth-optimism/plugins/hardhat/compiler'
import '@eth-optimism/plugins/hardhat/ethers'
import 'hardhat-deploy'

module.exports = {
  ovm: {
    solcVersion: "0.5.16"
  },
  solidity: {
    version:"0.5.16",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
    }
  },
  paths: {
    tests: "./ovm/ovmTests"
  },
  networks: {
      optimism: {
      url: 'https://kovan.optimism.io/',
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk'
      },
      ovm: true,
      gasPrice: 0,
      },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      69: "0x75E7aBED3406df8f2fD4E036Cbb5f6830bce525d",
    }
  }
};

