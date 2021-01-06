![GitHub Workflow Status](https://img.shields.io/github/workflow/status/RubiconDeFi/rubicon_protocol/Truffle%20Tests)
![GitHub](https://img.shields.io/github/license/RubiconDeFi/rubicon_protocol)
![Discord](https://img.shields.io/discord/752590582274326680?link=https://discord.com/invite/E7pS24J&link=https://discord.com/invite/E7pS24J)

## Docs

For detailed documentation of the Rubicon protocol please visit our [docs page](https://docs.rubicon.finance/)

# Rubicon Protocol

Rubicon is a blockchain-based protocol that is aimed at developing and ushering in the emergence of digital asset markets on the Ethereum blockchain. The inefficiencies that exist between firms and capital in traditional finance pose a key problem that Rubicon aims to solve. Rubicon aims to replace traditional intermediaries and costly third parties with open-source code in order to democratize, open, and accelerate global asset markets. This is achieved through the deployment, development, and management of the Rubicon protocol of smart contracts which are described and developed in this repository.

The Rubicon protocol aims to launch on the Ethereum mainnet soon. At that time, the community distribution of the governance token RBCN will be live and the first on-chain digital assets will be trading on Ethereum. If you are interested in joining our team, learning more, or want to contact Rubicon please feel free to reach us at contact@rubicon.finance - we would love to hear from you!

### Protocol Overview

There are a number of key smart contracts that facilitate the governance and operation of Rubicon. Please see below for an overview of our current smart contract infrastructure.

![](.gitbook/assets/rubicon-protocol-structure-working%20%281%29.jpg)

At a high level, Rubicon revolves around a core smart contract \(RubiconMarket.sol\) that facilitates the peer-to-peer transfer of tokens, digital assets, and any ERC-20 compliant token. Additionally, Rubicon and its governance token, RBCN, leverage a number of smart contracts to facilitate the decentralization of the protocol, community governance, and future iterations of the protocol.

## Developers: Start Rubicon Protocol Locally

```bash
$ git clone https://www.github.com/RubiconDeFi/rubicon_protocol.git   
$ cd rubicon_protocol && npm i
$ npm i --save-dev openzeppelin-solidity@2.5.1
$ truffle init
$ 'n' for overwriting contracts
$ 'n' for overwriting migrations
$ (in separate instance) ganache-cli
```

Also make sure that you comment out the lines in truffle-config.js that say 'development: ' and include localhost under networks, so that you can connect to Ganache.

Migrate the contracts to the blockchain of your choosing:
```bash
$ truffle migrate
```


## Developers: Local Testing

The command below will run all of the protocol tests located in the test folder which make sure that everything from trading functionality to the community distribution of RBCN are working correctly.
```bash
$ truffle test
```

