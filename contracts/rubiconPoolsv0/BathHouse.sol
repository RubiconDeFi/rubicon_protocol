pragma solidity =0.5.16;

import "./BathPair.sol";

contract BathHouse {
    string name = "ETH / USDC Liquidity Pool";

    address[] public allBathPairs;
    mapping(address => mapping(address => address)) public getPair;

    address public admin;
    address public RubiconMarketAddress;

    // List of approved strategies
    mapping(address => bool) approvedStrategies;
    mapping(address => bool) approvedPairs;

    bool public initialized;

    function initialize(address market) public {
        require(!initialized);
        admin = msg.sender;
        RubiconMarketAddress = market;
        initialized = true;
    }

    modifier onlyAdmin {
        require(msg.sender == admin);
        _;
    }

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
        pair.initialize();
        pair.initializePair(
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
        approvedStrategies[strategy] = true;
    }

    function isApprovedPair(address pair) external view returns (bool) {
        if (approvedPairs[pair] == true) {
            return true;
        } else {
            return false;
        }
    }

    function approvePair(address pair) internal returns (bool) {
        approvedPairs[pair] = true;
    }
}
