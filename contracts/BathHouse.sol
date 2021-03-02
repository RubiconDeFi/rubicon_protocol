pragma solidity ^0.5.16;

contract BathHouse {
    string name = 'ETH / USDC Liquidity Pool';

    // Link to UNI pools example: https://uniswap.org/docs/v2/core-concepts/pools/

    //deposit() - a function that should allow a user to deposit custom weights into a given pair
    // inputs: custom weights into the pool (x and 1-x), and native assets
    // outputs: return to the user a custom bathASSET and bathQUOTE in accordance to the pair
    //  needs to account for when a user deposits funds to correctly pay them back the right amount of yield

    //withdraw() - a function that should allow a user to send their bathASSET and bathQUOTE to the smart contract to withdraw provided liquidity
    // inputs: bathASSET and bathQUOTE tokens
    // outputs: receive the underlying + any yield and RBCN earned from their stake in the pool

    //onlyRubiconMarket - functionality that only allows the smart contract to send funds to the live Rubicon Market instance

    //placePairsTrade() - a function that places a bid and ask in the orderbook for the BathHouse's pair into the RubiconMarket orderbook
    // inputs: spread - the desired spread the pair of bid + ask should be placed outside of the midpoint of the orderbook
    // output: success or failure - log pair placed => note who the keeper is and store trade details in memory so next time placePairsTrade is called the keeper gets paid
    // Flow:
    //  1. cancel any partial fills previously made by this function call
    //  2. pay the keeper of said partial fill from the portion that was filled
    //  3. Identify new midpoint of orderbook
    //  4. perform sanity check to make sure this midpoint makes sense / no manipulation ?
    //  5. place new pair and save information

    // getMidpoint() - function to return the current midpoint/price of the orderbook while performing sanity checks if needed
}