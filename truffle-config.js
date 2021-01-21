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
        return new HDWalletProvider(process.env.PRIVATE_KEY, "https://kovan.infura.io/v3/" + process.env.INFURA_API_KOVAN)
      },
      network_id: 42,
      from: "0x75E7aBED3406df8f2fD4E036Cbb5f6830bce525d"
    }
  },
  solc: {
    optimizer: {
        enabled: true,
        runs: 200
    }
  }
};
