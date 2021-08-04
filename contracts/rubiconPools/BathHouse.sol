// SPDX-License-Identifier: BUSL-1.1

/// @author Benjamin Hughes - Rubicon
/// @notice This contract acts as the admin for the Rubicon Pools system
/// @notice The BathHouse approves library contracts and initializes bathPairs

pragma solidity =0.7.6;

import "./BathPair.sol";

contract BathHouse {
    string public name;

    mapping(address => mapping(address => address)) public getPair;

    address public admin;
    address public RubiconMarketAddress;

    // List of approved strategies
    mapping(address => bool) public approvedStrategies;
    mapping(address => bool) public approvedBathTokens;
    mapping(address => bool) public approvedPairs;
    mapping(address => bool) public approvedStrategists;

    mapping(address => bool) internal bathQuoteExists;
    mapping(address => bool) internal bathAssetExists;
    mapping(address => uint8) public propToStrategists;
    mapping(address => address) internal quoteToBathQuote;
    mapping(address => address) internal assetToBathAsset;

    bool public initialized;
    bool public permissionedStrategists; //if true strategists are permissioned

    // Key, system-wide risk parameters for Pools
    uint256 public reserveRatio; // proportion of the pool that must remain present in the pair

    // The delay after which unfilled orders are cancelled
    uint256 public timeDelay;

    // Constraint variable for the max amount of outstanding market making pairs at a time
    uint256 public maxOutstandingPairCount;

    /// @dev Proxy-safe initialization of storage
    function initialize(
        address market,
        uint256 _reserveRatio,
        uint256 _timeDelay,
        uint256 mopc
    ) external {
        require(!initialized);
        name = "Rubicon Bath House";
        admin = msg.sender;
        timeDelay = _timeDelay;
        require(_reserveRatio <= 100);
        require(_reserveRatio > 0);
        reserveRatio = _reserveRatio;

        maxOutstandingPairCount = mopc;

        RubiconMarketAddress = market;
        approveStrategist(admin);
        permissionedStrategists = true;
        initialized = true;
    }

    function initBathPair(
        address asset,
        address quote,
        address pair,
        uint8 _propToStrategists
    ) external onlyAdmin returns (address newPair) {
        //calls initialize on two Bath Tokens and spins them up
        require(asset != quote);
        require(asset != address(0));
        require(quote != address(0));

        // Ensure the pair doesn't exist and approved
        require(!isApprovedPair(getPair[asset][quote]));
        propToStrategists[pair] = _propToStrategists;

        getPair[asset][quote] = address(pair);

        approvePair(address(pair));
        addQuote(quote, BathPair(pair).getThisBathQuote());
        return address(pair);
    }

    modifier onlyAdmin {
        require(msg.sender == admin);
        _;
    }

    function setBathHouseAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }

    function setPermissionedStrategists(bool _new) external onlyAdmin {
        permissionedStrategists = _new;
    }

    // Setter Functions for paramters - onlyAdmin
    function setCancelTimeDelay(uint256 value) external onlyAdmin {
        timeDelay = value;
    }

    function setReserveRatio(uint256 rr) external onlyAdmin {
        require(rr <= 100);
        require(rr > 0);
        reserveRatio = rr;
    }

    function setPropToStrats(uint8 value, address pair) external onlyAdmin {
        require(value < 50);
        require(value >= 0);
        propToStrategists[pair] = value;
    }

    function setMaxOutstandingPairCount(uint256 value) external onlyAdmin {
        maxOutstandingPairCount = value;
    }

    function setBathTokenMarket(address bathToken, address newMarket)
        external
        onlyAdmin
    {
        BathToken(bathToken).setMarket(newMarket);
    }

    function setBathTokenBathHouse(address bathToken, address newAdmin)
        external
        onlyAdmin
    {
        BathToken(bathToken).setMarket(newAdmin);
    }

    function setBathTokenFeeBPS(address bathToken, uint256 newBPS)
        external
        onlyAdmin
    {
        BathToken(bathToken).setFeeBPS(newBPS);
    }

    function setFeeTo(address bathToken, address feeTo) external onlyAdmin {
        BathToken(bathToken).setFeeTo(feeTo);
    }

    function setBathPairMOSBPS(address bathPair, uint16 mosbps)
        external
        onlyAdmin
    {
        BathPair(bathPair).setMaxOrderSizeBPS(mosbps);
    }

    function setBathPairSearchRadius(address bathPair, uint256 sr)
        external
        onlyAdmin
    {
        BathPair(bathPair).setSearchRadius(sr);
    }

    function setBathPairSCN(address bathPair, int128 val) external onlyAdmin {
        BathPair(bathPair).setShapeCoefNum(val);
    }

    function setMarket(address newMarket) external onlyAdmin {
        RubiconMarketAddress = newMarket;
    }

    // Getter Functions for parameters - onlyAdmin
    function getMarket() external view returns (address) {
        return RubiconMarketAddress;
    }

    function getReserveRatio() external view returns (uint256) {
        return reserveRatio;
    }

    function getCancelTimeDelay() external view returns (uint256) {
        return timeDelay;
    }

    function getBathPair(address asset, address quote)
        external
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

    function approveStrategy(address strategy) external onlyAdmin {
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

    function isApprovedStrategist(address wouldBeStrategist)
        external
        view
        returns (bool)
    {
        if (
            approvedStrategists[wouldBeStrategist] == true ||
            !permissionedStrategists
        ) {
            return true;
        } else {
            return false;
        }
    }

    function approveStrategist(address strategist) public onlyAdmin {
        approvedStrategists[strategist] = true;
    }

    function approveBathToken(address bathToken) external onlyAdmin {
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

    function doesQuoteExist(address quote) external view returns (bool) {
        return bathQuoteExists[quote];
    }

    function doesAssetExist(address asset) external view returns (bool) {
        return bathAssetExists[asset];
    }

    function quoteToBathQuoteCheck(address quote)
        public
        view
        returns (address)
    {
        return quoteToBathQuote[quote];
    }

    function getBPSToStrats(address pair) external view returns (uint8) {
        return propToStrategists[pair];
    }
}
