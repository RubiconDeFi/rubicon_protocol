require('dotenv').config();
var HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 6721975,  
    },
    kovan: {
      provider: function() {
        return new HDWalletProvider(process.env.PRIVATE_KEY_KOVAN, "https://kovan.infura.io/v3/" + process.env.INFURA_API_KEY)
      },
      network_id: 42,
      from: process.env.EXCHANGE_LAUNCH_ADDRESS_KOVAN,
      gasPrice: 50000000000
    },
    mainnet: {
      provider: function() {
        return new HDWalletProvider(process.env.PRIVATE_KEY_MAINNET, "https://mainnet.infura.io/v3/" + process.env.INFURA_API_KEY)
      },
      network_id: 1,
      from: process.env.EXCHANGE_LAUNCH_ADDRESS_MAINNET,
      // gasPrice: 50000000000,
      // gas: 12000000,
      timeoutBlocks: 220
    }
  },
  solc: {
    optimizer: {
        enabled: true,
        runs: 200
    }
  }
};
