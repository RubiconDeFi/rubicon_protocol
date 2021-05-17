var HDWalletProvider = require('truffle-hdwallet-provider');
require('dotenv').config();

const mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
const { ganache } = require('@eth-optimism/ovm-toolchain');

const GAS_LIMIT = 0x1fffffffffffff
const GAS_PRICE = 0x1

module.exports = {
  contracts_directory: '../contracts',
  contracts_build_directory: '../build',
  test_directory: '../test',
  migrations_directory: '../migrations',

  networks: {
    // *** Launch ganache with: ganache-cli --port 7545 --networkId 5777 --gasLimit=0x1fffffffffffff --gasPrice=0x1 --allowUnlimitedContractSize ***
    // *** Migrations working with above configuration
    test: {
      network_id: "69",
      networkCheckTimeout: 100000,
      provider: function() {
        return ganache.provider({
          mnemonic: mnemonic,
          network_id: "69",
          default_balance_ether: 100,
          gasLimit: GAS_LIMIT,
          gasPrice: GAS_PRICE,
        })
      },
      gas: GAS_LIMIT,
      gasPrice: GAS_PRICE,
    },
    kovan: {
      networkCheckTimeout: 10000,
      provider: function() {
        return ganache.provider({
          mnemonic: mnemonic,
          default_balance_ether: 100,
          gasLimit: GAS_LIMIT,
          gasPrice: 0,
          network_id: 69,
          providerOrUrl: 'https://kovan.optimism.io'
        })
      },
      network_id: "69",
      from: process.env.EXCHANGE_LAUNCH_ADDRESS_KOVAN,
      gasPrice: 0,
      timeoutBlocks: 220,
      gas: GAS_LIMIT
      // skipDryRun: true,
    },
  },

  mocha: {
    timeout: 100000
  },

  compilers: {
    solc: {
      version: "../node_modules/@eth-optimism/solc",
      optimizer: {
        enabled: true,
        runs: 200
    },
    }
  }
}