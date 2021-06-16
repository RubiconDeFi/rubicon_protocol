/// @author Benjamin Hughes - Rubicon
/// @notice This contract acts as the admin for the Rubicon Pools system
/// @notice The BathHouse approves strategist contracts and initializes bathPairs

pragma solidity =0.7.6;

import "./BathPair.sol";

contract BathHouse {
    string public name = "Rubicon Bath House";

    address[] public allBathPairs;
    mapping(address => mapping(address => address)) public getPair;

    address public admin;
    address public RubiconMarketAddress;

    // List of approved strategies
    mapping(address => bool) approvedStrategies;
    mapping(address => bool) approvedBathTokens;
    mapping(address => bool) approvedPairs;
    mapping(address => bool) bathQuoteExists;
    mapping(address => bool) bathAssetExists;
    mapping(address => uint8) propToStrategists;
    mapping(address => address) quoteToBathQuote;
    mapping(address => address) assetToBathAsset;

    bool public initialized;

    // Key, system-wide risk parameters for Pools
    uint256 public reserveRatio; // proportion of the pool that must remain present in the pair

    // The delay after which unfilled orders are cancelled
    uint256 public timeDelay;

    // Constraint variable for the max amount of outstanding market making pairs at a time
    uint256 public maxOutstandingPairCount;

    function initialize(
        address market,
        uint256 _reserveRatio,
        uint256 _timeDelay,
        uint256 mopc
        // string memory _name
    ) public {
        require(!initialized);
        admin = msg.sender;
        // name = _name;    
        timeDelay = _timeDelay;
        require(_reserveRatio <= 100);
        require(_reserveRatio > 0);
        reserveRatio = _reserveRatio;

        maxOutstandingPairCount = mopc;

        RubiconMarketAddress = market;
        initialized = true;
    }

    modifier onlyAdmin {
        require(msg.sender == admin);
        _;
    }

    function setCancelTimeDelay(uint256 value) external onlyAdmin {
        timeDelay = value;
    }

    function setPropToStrats(uint8 value, address pair) external onlyAdmin {
        require(value < 50);
        propToStrategists[pair] = value;
    }

    function setMaxOutstandingPairCount(uint256 value) external onlyAdmin {
        maxOutstandingPairCount = value;
    }

    function setBathTokenMarket(address bathToken, address newMarket) external onlyAdmin {
        BathToken(bathToken).setMarket(newMarket);
    }

    function setBathTokenBathHouse(address bathToken, address newAdmin) external onlyAdmin {
        BathToken(bathToken).setMarket(newAdmin);
    }

    function getMarket() public view returns (address) {
        return RubiconMarketAddress;
    }

    function initBathPair(
        address asset,
        // string calldata assetName,
        address quote,
        // string calldata quoteName,
        // uint256 _reserveRatio,
        // uint256 _timeDelay,
        // uint256 _maxOutstandingPairCount
        address pair,
        uint8 _propToStrategists
    ) external onlyAdmin returns (address newPair) {
        //calls initialize on two Bath Tokens and spins them up
        require(asset != quote);
        require(asset != address(0));
        require(quote != address(0));

        // Ensure the pair doesn't exist and approved
        require(!isApprovedPair(getPair[asset][quote]));
        allBathPairs.push(address(pair));
        propToStrategists[pair] = _propToStrategists;

        getPair[asset][quote] = address(pair);

        approvePair(address(pair));
        addQuote(quote, BathPair(pair).getThisBathQuote());
        return address(pair);
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

    function isApprovedBathToken(address bathToken)
        external
        view
        returns (bool)
    {
        if (approvedBathTokens[bathToken] == true) {
            return true;
        } else {
            return false;
        }
    }

    function approveBathToken(address bathToken)
        external
        onlyAdmin
        returns (bool)
    {
        approvedBathTokens[bathToken] = true;
    }

    function isApprovedPair(address pair) public view returns (bool) {
        if (approvedPairs[pair] == true) {
            return true;
        } else {
            return false;
        }
    }

    function approvePair(address pair) internal {
        approvedPairs[pair] = true;
    }

    function removePair(address pair) external onlyAdmin {
        approvedPairs[pair] = false;
    }

    function addQuote(address quote, address bathQuote) internal {
        if (bathQuoteExists[quote]) {
            return;
        } else {
            bathQuoteExists[quote] = true;
            quoteToBathQuote[quote] = bathQuote;
        }
    }

    function addAsset(address asset, address bathAsset) internal {
        if (bathAssetExists[asset]) {
            return;
        } else {
            bathAssetExists[asset] = true;
            assetToBathAsset[asset] = bathAsset;
        }
    }

    function doesQuoteExist(address quote) public view returns (bool) {
        return bathQuoteExists[quote];
    }

    function doesAssetExist(address asset) public view returns (bool) {
        return bathAssetExists[asset];
    }

    function quoteToBathQuoteCheck(address quote)
        public
        view
        returns (address)
    {
        return quoteToBathQuote[quote];
    }

    function getPropToStrats(address pair) external view returns(uint8){
        return propToStrategists[pair];
    }
}
