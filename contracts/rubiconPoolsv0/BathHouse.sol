pragma solidity =0.5.16;

import "./BathPair.sol";

contract BathHouse {
    string public name = "Rubicon Bath House";

    address[] public allBathPairs;
    mapping(address => mapping(address => address)) public getPair;

    address public admin;
    address public RubiconMarketAddress;

    // List of approved strategies
    mapping(address => bool) approvedStrategies;
    mapping(address => bool) approvedPairs;
    mapping(address => bool) bathQuoteExists;
    mapping(address => address) quoteToBathQuote;

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
        string calldata quoteName,
        uint256 _reserveRatio,
        uint256 _timeDelay,
        uint256 _maxOutstandingPairCount
    ) external onlyAdmin returns (address newPair) {
        //calls initialize on two Bath Tokens and spins them up
        require(asset != quote);
        require(asset != address(0));
        require(quote != address(0));
        require(
            getPair[asset][quote] == address(0),
            "Bath Pair already exists"
        );
        require(_reserveRatio < 100);
        require(_reserveRatio > 60);
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
            _reserveRatio,
            _timeDelay,
            _maxOutstandingPairCount
        );
        getPair[asset][quote] = newPair;

        approvePair(newPair);
        addQuote(quote, address(pair.bathQuoteAddress));
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

    function approvePair(address pair) internal {
        approvedPairs[pair] = true;
    }

    function addQuote(address quote, address bathQuote) internal {
        if (bathQuoteExists[quote]) {
            return;
        } else {
            bathQuoteExists[quote] = true;
            quoteToBathQuote[quote] = bathQuote;
        }
    }

    function doesQuoteExist(address quote) public view returns (bool) {
        return bathQuoteExists[quote];
    }

    function quoteToBathQuoteCheck(address quote)
        public
        view
        returns (address)
    {
        return quoteToBathQuote[quote];
    }

    // toTest
    function setCancelTimeDelay(address bathPair, uint256 value)
        public
        onlyAdmin
    {
        BathPair(bathPair).setCancelTimeDelay(value);
    }

    // toTest
    function setMaxOutstandingPairCount(address bathPair, uint256 value)
        public
        onlyAdmin
    {
        BathPair(bathPair).setMaxOutstandingPairCount(value);
    }
}
