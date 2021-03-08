pragma solidity =0.5.16;

import "./BathPair.sol";

contract BathHouse {
    string name = "ETH / USDC Liquidity Pool";
    string name1 = "BathHouse";

    address[] public allBathPairs;
    mapping(address => mapping(address => address)) public getPair;

    address public admin;
    address public RubiconMarketAddress;

    constructor(address market) public {
        admin = msg.sender;
        RubiconMarketAddress = market;
    }

    //****Acts as the initializer/factory/admin of BathPairs*****
    //*** Acts as quarterback for BathToken interactions:*/
    // e.g. init them, placePairs trade

    // Build / Test flow:
    // 1. [X] Init a bathPair
    // 2. [X] Allow users to deposit liquidity into bath pair w/ custom weights while receiving Token
    // 3. [] Test BathHouse calling on bath tokens ability to place pairs placePairsTrade <- build this logic
    // 4. [X] test a withdrawl... place

    //deposit() - a function that should allow a user to deposit custom weights into a given pair
    // inputs: custom weights into the pool (x and 1-x), and native assets
    // outputs: return to the user a custom bathASSET and bathQUOTE in accordance to the pair
    //  needs to account for when a user deposits funds to correctly pay them back the right amount of yield

    function initBathPair(
        address asset,
        string calldata assetName,
        address quote,
        string calldata quoteName
    ) external returns (address newPair) {
        //calls initialize on two Bath Tokens and spins them up
        require(asset != quote);
        require(asset != address(0));
        require(quote != address(0));
        require(
            getPair[asset][quote] == address(0),
            "Bath Pair already exists"
        );

        BathPair pair = new BathPair();
        newPair = address(pair);
        allBathPairs.push(newPair);
        pair.initialize(
            asset,
            assetName,
            quote,
            quoteName,
            RubiconMarketAddress
        );
        getPair[asset][quote] = newPair;
        return newPair;
    }

    function getBathPair(address asset, address quote)
        public
        view
        returns (address pair)
    {
        return getPair[asset][quote];
    }

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
