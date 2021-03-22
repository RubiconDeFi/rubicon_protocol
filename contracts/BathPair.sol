pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./BathToken.sol";
import "./RubiconMarket.sol";
import "./peripheral_contracts/SafeMath.sol";
import "./Strategy.sol";

contract BathPair {
    address public bathHouse;
    address public underlyingAsset;
    address public underlyingQuote;

    address public bathAssetAddress;
    address public bathQuoteAddress;

    address public RubiconMarketAddress;

    mapping(address => uint256[]) addressToHoldings;

    uint256[] public outstandingAskIDs;
    uint256[] public outstandingBidIDs;
    uint256[2][] public outstandingPairIDs;

    // Risk Parameters
    uint public reserveRatio; // proportion of the pool that must remain present in the pair
    uint public maximumOrderSize; // max order size that can be places in a single order
    mapping(address => bool) approvedStrategies;

    event LogTrade(uint256, ERC20, uint256, ERC20);
    event LogNote(string, uint256);
    event Cancel(uint, ERC20, uint);

    constructor() public {
        bathHouse = msg.sender;
    }

    // TODO: add onlyKeeper modifier while using permissioned keepers
    modifier onlyApprovedStrategy {
        require(isApprovedStrat(msg.sender) == true, "not an approved sender");
        _;
    }

    modifier onlyBathHouse {
        require(msg.sender == bathHouse);
        _;
    }

    function isApprovedStrat(address strategy) internal returns (bool) {
        // TODO: Check that this works as intended
        if (approvedStrategies[strategy] == true) {
            return true;
        } else {
            return false;
        }
    }

    function setApprovedStrat(address strategy) external onlyBathHouse returns (bool) {
        // add to approvedStrategies
        //  TODO: allow for permissioned adding of Strategies
    }   


    // initialize() -start the token
    function initialize(
        address asset,
        string calldata assetName,
        address quote,
        string calldata quoteName,
        address market
    ) external {
        require(msg.sender == bathHouse, "caller must be Bath House");
        underlyingAsset = asset;
        underlyingQuote = quote;

        //deploy new BathTokens:
        BathToken bathAsset =
            new BathToken(
                string(abi.encodePacked("bath", (assetName))),
                asset,
                market
            );
        bathAssetAddress = address(bathAsset);

        BathToken bathQuote =
            new BathToken(
                string(abi.encodePacked("bath", (quoteName))),
                quote,
                market
            );
        bathQuoteAddress = address(bathQuote);

        RubiconMarketAddress = market;
    }

    function deposit(
        address asset,
        uint256 assetAmount,
        address quote,
        uint256 quoteAmount
    ) external returns (uint256 bathAssetAmount, uint256 bathQuoteAmount) {
        // require(bathTokens exist)
        require(asset != quote);
        require(asset == underlyingAsset, "wrong asset nerd");
        require(quote == underlyingQuote, "wrong quote nerd");

        // mint the bathTokens to the user in accordance to weights, send underlying assets to each Bath Token
        IERC20(asset).transferFrom(msg.sender, bathAssetAddress, assetAmount);
        IERC20(quote).transferFrom(msg.sender, bathQuoteAddress, quoteAmount);

        // (bool success0, bytes memory data0) = (asset).delegatecall(abi.encodeWithSignature("approve(address,uint)", bathAssetAddress, assetAmount));
        // (bool success1, bytes memory data1) = (quote).delegatecall(abi.encodeWithSignature("approve(address,uint)", bathQuoteAddress, quoteAmount));

        // _mint(msg.sender, amount);
        IBathToken(bathAssetAddress).mint(msg.sender, assetAmount);
        IBathToken(bathQuoteAddress).mint(msg.sender, quoteAmount);

        //filler for return values
        return (assetAmount, quoteAmount);
    }

    function withdraw(
        address asset,
        uint256 assetAmount,
        address quote,
        uint256 quoteAmount
    ) external {
        require(asset != quote);
        require(asset == underlyingAsset, "wrong asset nerd");
        require(quote == underlyingQuote, "wrong quote nerd");

        require(
            IERC20(asset).balanceOf(bathAssetAddress) >= assetAmount,
            "Not enough underlying in bathToken"
        );
        require(
            IERC20(quote).balanceOf(bathQuoteAddress) >= quoteAmount,
            "Not enough underlying in bathToken"
        );

        //Return funds to users
        IBathToken(bathAssetAddress).withdraw(msg.sender, assetAmount);
        IBathToken(bathQuoteAddress).withdraw(msg.sender, quoteAmount);
    }

    function executeStrategy() external onlyApprovedStrategy {
        // perform crucial checks to ensure that reserve ratio is maintained...
    }

    function manageInventory() external onlyApprovedStrategy {

    }
 
}
