const Web3 = require('web3');
require("dotenv");

let web3 = new Web3("ws://localhost:8545");

console.log("Web3 Version: ", web3.version);

// Pseudocode - As a loop:
// 1. Grab the current price for a Kovan pair
// 2. executeStrategy --> Place better a bid and ask at the best bid/ask - 1
// 3. Rinse repeat...

