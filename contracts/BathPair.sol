pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./BathToken.sol";
import "./BathHouse.sol";
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
    uint256 public reserveRatio; // proportion of the pool that must remain present in the pair
    uint256 public maximumOrderSize; // max order size that can be places in a single order

    event LogTrade(uint256, ERC20, uint256, ERC20);
    event LogNote(string, uint256);
    event Cancel(uint256, ERC20, uint256);

    constructor() public {
        bathHouse = msg.sender;
    }

    // TODO: add onlyKeeper modifier while using permissioned keepers

    modifier onlyBathHouse {
        require(msg.sender == bathHouse);
        _;
    }

    modifier enforceReserveRatio {
        require((BathToken(bathAssetAddress).totalSupply() * reserveRatio) / 100 <= IERC20(underlyingAsset).balanceOf(bathAssetAddress));
        require((BathToken(bathQuoteAddress).totalSupply() * reserveRatio) / 100 <= IERC20(underlyingQuote).balanceOf(bathQuoteAddress));
        _;
        require((BathToken(bathAssetAddress).totalSupply() * reserveRatio) / 100 <= IERC20(underlyingAsset).balanceOf(bathAssetAddress));
        require((BathToken(bathQuoteAddress).totalSupply() * reserveRatio) / 100 <= IERC20(underlyingQuote).balanceOf(bathQuoteAddress));
    }

    modifier onlyApprovedStrategy(address targetStrategy) {
        require(
            BathHouse(bathHouse).isApprovedStrat(targetStrategy) == true,
            "not an approved sender"
        );
        _;
    }

    // initialize() -start the token
    function initialize(
        address asset,
        string calldata assetName,
        address quote,
        string calldata quoteName,
        address market,
        uint _reserveRatio
    ) external {
        require(msg.sender == bathHouse, "caller must be Bath House");
        require(_reserveRatio <= 100);
        require(_reserveRatio > 0);
        reserveRatio = _reserveRatio;

        underlyingAsset = asset;
        underlyingQuote = quote;

        //deploy new BathTokens:
        BathToken bathAsset =
            new BathToken(
                string(abi.encodePacked("bath", (assetName))),
                asset,
                market,
                bathHouse
            );
        bathAssetAddress = address(bathAsset);

        BathToken bathQuote =
            new BathToken(
                string(abi.encodePacked("bath", (quoteName))),
                quote,
                market,
                bathHouse
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

    function executeStrategy(address targetStrategy)
        external
        onlyApprovedStrategy(targetStrategy) enforceReserveRatio
    {   

        Strategy(targetStrategy).execute(
            underlyingAsset,
            bathAssetAddress,
            underlyingQuote,
            bathQuoteAddress
        );

        // Return settled trades to the appropriate bathToken
        require(IERC20(underlyingAsset).balanceOf(bathQuoteAddress) == 0, "yield not correctly rebalanced");
        require(IERC20(underlyingQuote).balanceOf(bathAssetAddress) == 0, "yield not correctly rebalanced");
    }
}
