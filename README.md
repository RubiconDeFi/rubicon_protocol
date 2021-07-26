![GitHub Workflow Status](https://img.shields.io/github/workflow/status/RubiconDeFi/rubicon_protocol/Truffle%20Tests)
![Discord](https://img.shields.io/discord/752590582274326680?link=https://discord.com/invite/E7pS24J&link=https://discord.com/invite/E7pS24J)

## Docs

For detailed documentation of the Rubicon protocol please visit our [docs](https://docs.rubicon.finance/)

# Rubicon Protocol

Rubicon is a Layer 2, open-orderbook DEX built on the EVM and [Optimism](https://optimism.io/). Rubicon is also a blockchain-based protocol that is aimed at developing and ushering in the emergence of digital asset markets on the Ethereum blockchain. Read more about our mission and Rubicon [here](https://www.rubicon.finance/)

The Rubicon protocol aims to launch on the Optimism Layer 2 mainnet soon!

### Protocol Overview

There are a number of key smart contracts that facilitate the governance and operation of Rubicon. Please see below for an overview of our current smart contract infrastructure.

At a high level, Rubicon revolves around a core smart contract [RubiconMarket.sol](https://github.com/RubiconDeFi/rubicon_protocol/blob/master/contracts/RubiconMarket.sol) that facilitates the peer-to-peer transfer of tokens, digital assets, and any ERC-20 compliant token.

## Start Rubicon Protocol Locally

```bash
$ git clone https://www.github.com/RubiconDeFi/rubicon_protocol.git   
$ cd rubicon_protocol && npm i
$ (in a separate instance) ganache-cli
```

## Developers: Local Testing - EVM

The command below will run all of the protocol tests located in the test folder which make sure that everything from trading functionality to the community distribution of RBCN are working correctly in the EVM.
```bash
$ truffle test
```
