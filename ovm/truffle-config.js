const mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
const { ganache } = require('@eth-optimism/ovm-toolchain');

const GAS_LIMIT = 100000000
const GAS_PRICE = 10

module.exports = {
  contracts_directory: '../contracts',
  contracts_build_directory: '../build',
  test_directory: 'ovmTests',
  migrations_directory: '../migrations',

  networks: {
    // *** Launch ganache with: ganache-cli --port 7545 --networkId 5777 --gasLimit 100000000 ***
    test: {
      // host: "127.0.0.1",
      // port: 8545,
      network_id: "*",
      networkCheckTimeout: 100000,
      provider: function() {
        return ganache.provider({
          mnemonic: mnemonic,
          network_id: "*",
          default_balance_ether: 100,
          gasLimit: GAS_LIMIT,
          gasPrice: GAS_PRICE,
        })
      },
      gas: GAS_LIMIT,
      gasPrice: GAS_PRICE,
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
        runs: 999999
    },
    }
  }
}