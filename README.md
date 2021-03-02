![GitHub Workflow Status](https://img.shields.io/github/workflow/status/RubiconDeFi/rubicon_protocol/Truffle%20Tests)
![GitHub](https://img.shields.io/github/license/RubiconDeFi/rubicon_protocol)
![Discord](https://img.shields.io/discord/752590582274326680?link=https://discord.com/invite/E7pS24J&link=https://discord.com/invite/E7pS24J)

## Docs

For detailed documentation of the Rubicon protocol please visit our [docs](https://docs.rubicon.finance/)

# Rubicon Protocol

Rubicon is a Layer 2, open-orderbook DEX built on the EVM and [Optimism](https://optimism.io/). Rubicon is also a blockchain-based protocol that is aimed at developing and ushering in the emergence of digital asset markets on the Ethereum blockchain. Read more about our mission and Rubicon [here](https://www.rubicon.finance/)

The Rubicon protocol aims to launch on the Optimism Layer 2 mainnet soon. At that time, the community distribution of the governance token RBCN will be live. If you are interested in joining our team, learning more, or want to contact Rubicon please feel free to reach us at contact@rubicon.finance - we would love to hear from you!

### Protocol Overview

There are a number of key smart contracts that facilitate the governance and operation of Rubicon. Please see below for an overview of our current smart contract infrastructure.

At a high level, Rubicon revolves around a core smart contract [RubiconMarket.sol](https://github.com/RubiconDeFi/rubicon_protocol/blob/master/contracts/RubiconMarket.sol) that facilitates the peer-to-peer transfer of tokens, digital assets, and any ERC-20 compliant token. Additionally, Rubicon and its governance token, RBCN, leverage a number of smart contracts to facilitate the decentralization of the protocol, community governance, and future iterations of the protocol.

## Start Rubicon Protocol Locally

```bash
$ git clone https://www.github.com/RubiconDeFi/rubicon_protocol.git   
$ cd rubicon_protocol && npm i
$ npm i --save-dev openzeppelin-solidity@2.5.1
$ truffle init
$ 'n' for overwriting contracts
$ 'n' for overwriting migrations
$ (in a separate instance) ganache-cli
```

Migrate the contracts to the blockchain of your choosing:
```bash
$ truffle compile --all
$ truffle migrate
```

## Developers: Local Testing - EVM

The command below will run all of the protocol tests located in the test folder which make sure that everything from trading functionality to the community distribution of RBCN are working correctly in the EVM.
```bash
$ truffle test
```

## Developers: Local Testing - OVM

All OVM specific logic, tests, and configs are contained in the 'ovm' folder of the repository. Given the OVM's nature of being nearly 1:1 with native Solidity and the EVM most core testing logic lives in the test folder for Layer 1 EVM testing. 

To compile the project's contracts in the OVM or run the suite of OVM tests located in ./ovm/ovmTests simply run the following from the root directory:
```bash
$ npx hardhat compile
$ npx hardhat test
```

To compile or migrate via truffle in the OVM with a ganache instance running, run the following from the root directory:
```bash
$ cd ovm
$ truffle compile --all
$ truffle migrate --reset
```
