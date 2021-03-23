pragma solidity =0.5.16;

import "./BathPair.sol";

contract BathHouse {
    string name = "ETH / USDC Liquidity Pool";
    string name1 = "BathHouse";

    address[] public allBathPairs;
    mapping(address => mapping(address => address)) public getPair;

    address public admin;
    address public RubiconMarketAddress;

    // List of approved strategies
    mapping(address => bool) approvedStrategies;
    mapping(address => bool) approvedPairs;

    constructor(address market) public {
        admin = msg.sender;
        RubiconMarketAddress = market;
    }

    modifier onlyAdmin {
        require(msg.sender == admin);
        _;
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
            RubiconMarketAddress,
            90
        );
        getPair[asset][quote] = newPair;

        approvePair(newPair);
        return newPair;
    }

    function getBathPair(address asset, address quote)
        public
        view
        returns (address pair)
    {
        return getPair[asset][quote];
    }

    function isApprovedStrat(address strategy) external view returns (bool) {
        // TODO: Check that this works as intended
        if (approvedStrategies[strategy] == true) {
            return true;
        } else {
            return false;
        }
    }

    function approveStrategy(address strategy)
        external
        onlyAdmin
        returns (bool)
    {
        // TODO: require check that strategy adheres to IStrategy;
        approvedStrategies[strategy] = true;
    }

    function isApprovedPair(address pair) external view returns (bool) {
        // TODO: Check that this works as intended
        if (approvedPairs[pair] == true) {
            return true;
        } else {
            return false;
        }
    }

    function approvePair(address pair) internal returns (bool) {
        // TODO: require check that strategy adheres to IStrategy;
        approvedPairs[pair] = true;
    }
}
