# ethereum-nonce-manager

## Problem
Publishing thousands of transactions into an ethereum network using web3.js requires a reliable nonce management to prevent collisions especially when done in parallel.
Every time a transaction is signed a nonce has to be generated. How can a component reliably get the "next" nonce assigned? Web3.js offers a method to get the current transaction count (even including pending transactions) however transactions that are just being build and/or are not send to the network already are not being taken into account.

## Solution
The application is keeping track of the nonce itself without reling on the actual transaction count from the network.

Periodically the local nonce is synced with the network. While the synchronization takes place requests for new nonces are locked and put into a queue.

The syncing can happen after the application is idling for a while (eg. no nonce has been requested within n minutes).

## Usage

```
NonceManager.getTransactionPermission().then(() => console.log("Next nonce is", NonceManager.getNextNonce()))
```
