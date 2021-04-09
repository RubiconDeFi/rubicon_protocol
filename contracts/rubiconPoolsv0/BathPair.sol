pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./BathToken.sol";
import "./BathHouse.sol";
import "../RubiconMarket.sol";
import "../peripheral_contracts/SafeMath.sol";
import "../interfaces/IStrategy.sol";

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

    bool public initialized;

    function initialize() public {
        require(!initialized);
        bathHouse = msg.sender;
        initialized = true;
    }

    // TODO: add onlyKeeper modifier while using permissioned keepers

    modifier onlyBathHouse {
        require(msg.sender == bathHouse);
        _;
    }

    modifier enforceReserveRatio {
        require(
            (BathToken(bathAssetAddress).totalSupply() * reserveRatio) / 100 <=
                IERC20(underlyingAsset).balanceOf(bathAssetAddress)
        );
        require(
            (BathToken(bathQuoteAddress).totalSupply() * reserveRatio) / 100 <=
                IERC20(underlyingQuote).balanceOf(bathQuoteAddress)
        );
        _;
        require(
            (BathToken(bathAssetAddress).totalSupply() * reserveRatio) / 100 <=
                IERC20(underlyingAsset).balanceOf(bathAssetAddress)
        );
        require(
            (BathToken(bathQuoteAddress).totalSupply() * reserveRatio) / 100 <=
                IERC20(underlyingQuote).balanceOf(bathQuoteAddress)
        );
    }

    modifier onlyApprovedStrategy(address targetStrategy) {
        require(
            BathHouse(bathHouse).isApprovedStrat(targetStrategy) == true,
            "not an approved sender"
        );
        _;
    }

    // initialize() -start the token
    function initializePair(
        address asset,
        string calldata assetName,
        address quote,
        string calldata quoteName,
        address market,
        uint256 _reserveRatio
    ) external {
        require(msg.sender == bathHouse, "caller must be Bath House");
        require(_reserveRatio <= 100);
        require(_reserveRatio > 0);
        reserveRatio = _reserveRatio;

        underlyingAsset = asset;
        underlyingQuote = quote;

        //deploy new BathTokens:
        BathToken bathAsset = new BathToken();
        bathAsset.initialize(
            string(abi.encodePacked("bath", (assetName))),
            asset,
            market,
            bathHouse,
            quote
        );
        bathAssetAddress = address(bathAsset);

        BathToken bathQuote = new BathToken();
        bathQuote.initialize(
            string(abi.encodePacked("bath", (quoteName))),
            quote,
            market,
            bathHouse,
            asset
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

    function rebalancePair() internal {
        uint256 bathAssetYield =
            ERC20(underlyingQuote).balanceOf(bathAssetAddress);
        uint256 bathQuoteYield =
            ERC20(underlyingAsset).balanceOf(bathQuoteAddress);

        if (bathAssetYield > 0) {
            BathToken(bathAssetAddress).rebalance(bathQuoteAddress);
        }

        if (bathQuoteYield > 0) {
            BathToken(bathQuoteAddress).rebalance(bathAssetAddress);
        }

        // Return settled trades to the appropriate bathToken
        require(
            IERC20(underlyingAsset).balanceOf(bathQuoteAddress) == 0,
            "yield not correctly rebalanced"
        );
        require(
            IERC20(underlyingQuote).balanceOf(bathAssetAddress) == 0,
            "yield not correctly rebalanced"
        );
    }

    function executeStrategy(
        address targetStrategy,
        uint256 askNumerator, // Quote / Asset
        uint256 askDenominator, // Asset / Quote
        uint256 bidNumerator, // size in ASSET
        uint256 bidDenominator // size in QUOTES
    ) external onlyApprovedStrategy(targetStrategy) enforceReserveRatio {
        IStrategy(targetStrategy).execute(
            underlyingAsset,
            bathAssetAddress,
            underlyingQuote,
            bathQuoteAddress,
            askNumerator, // ask pay_amt
            askDenominator, // ask buy_amt
            bidNumerator, // bid pay_amt
            bidDenominator // bid buy_amt
        );

        // Return any filled yield to the appropriate bathToken
        rebalancePair();
    }
}
