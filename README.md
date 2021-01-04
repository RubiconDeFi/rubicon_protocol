![GitHub Workflow Status](https://img.shields.io/github/workflow/status/RubiconDeFi/rubicon_protocol/Truffle%20Tests)
![GitHub](https://img.shields.io/github/license/RubiconDeFi/rubicon_protocol)
![Discord](https://img.shields.io/discord/752590582274326680&?link=https://discord.com/invite/E7pS24J)

# Rubicon Protocol

Rubicon is the first decentralized protocol that is aimed at developing and ushering in the emergence of equity markets on the Ethereum blockchain. The inefficiencies that exist between firms and capital in traditional finance pose a key problem that Rubicon aims to solve. Rubicon replaces traditional intermediaries and costly third parties with open-source code in order to democratize, open, and accelerate global equity markets. This is achieved through the deployment, development, and management of the Rubicon protocol of smart contracts which are described throughout these docs.

The Rubicon protocol aims to launch on the mainnet in or before December of 2020. At that time, the community distribution of our governance token RBCN will be live and the first on-chain equities will be trading on Ethereum. If you are interested in joining our team, learning more, or want to contact Rubicon please feel free to reach us at contact@rubicon.finance - we would love to hear from you!

### Protocol Overview

There are a number of key smart contracts that facilitate the governance and operation of Rubicon. Please see below for an overview of our current smart contract infrastructure.

![](.gitbook/assets/rubicon-protocol-structure-working%20%281%29.jpg)

At a high level, Rubicon revolves around a core smart contract \(RubiconMarket.sol\) that facilitates the peer-to-peer transfer of security tokens, digital assets, and any ERC-20 compliant token. Additionally, Rubicon and its governance token, RBCN, leverage a number of smart contracts to facilitate the decentralization of the protocol, community governance, and future iterations of the protocol.

## For Devs: Start Rubicon Protocol Locally

```bash
$ git clone https://www.github.com/RubiconDeFi/rubicon_protocol.git   
$ cd rubicon_protocol && npm i
$ npm i --save-dev hardhat
$ npm i --save-dev openzeppelin-solidity@2.5.1
$ truffle init
$ 'n' for overwriting contracts
$ 'n' for overwriting migrations
$ (in separate tab) ganache-cli
```

Also make sure that you comment out the lines in truffle-config.js that say 'development: ' and includes localhost under networks, so that you can connect to Ganache.

```bash
$ truffle migrate -- deploys contracts to development network, i.e. localhost
$ truffle console to interact with contracts deployed
```

## For Devs: Local Testing

```bash
$ npx hardhat test
```

