![GitHub Workflow Status](https://img.shields.io/github/workflow/status/RubiconDeFi/rubicon_protocol/Truffle%20Tests)
![Discord](https://img.shields.io/discord/752590582274326680?link=https://discord.com/invite/E7pS24J&link=https://discord.com/invite/E7pS24J)

## Docs

For detailed documentation of the Rubicon protocol please visit our [docs](https://docs.rubicon.finance/)

# Rubicon Protocol

Rubicon is an open order book protocol for Ethereum. The protocol is Layer 2-native and will launch across multiple L2 networks such as [Optimism](https://optimism.io/), [Arbitrum](https://arbitrum.io/), [zkSync](https://zksync.io/), and [StarkNet](https://starkware.co/starknet/).

The Rubicon protocol is currently live on the Optimistic Ethereum network. You can use it today on the [Rubicon App](https://app.rubicon.finance).

### Protocol Overview

A number of key smart contracts house the primary operations of the Rubicon protocol. Please see below for an overview of our current smart contract infrastructure.

At a high level, Rubicon revolves around a core smart contract [RubiconMarket.sol](https://github.com/RubiconDeFi/rubicon_protocol/blob/master/contracts/RubiconMarket.sol) that facilitates peer-to-peer trades of ERC-20 tokens using an open order book.

[Rubicon Pools](https://docs.rubicon.finance/contracts/rubicon-pools) is a separate system of smart contracts that enables passive liquidity providing on the Rubicon order books.

![image](https://user-images.githubusercontent.com/60487118/142698674-4b21a487-72b8-4c1b-9d7c-f340d00352fc.png)

## Start Rubicon Protocol Locally

```bash
$ git clone https://www.github.com/RubiconDeFi/rubicon_protocol.git   
$ cd rubicon_protocol && npm i
$ (in a separate instance) npm run ganache
$ npm run test
```
