pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./BathToken.sol";
import "./RubiconMarket.sol";

contract BathPair {

    address public bathHouse;
    address public underlyingAsset;
    address public underlyingQuote;

    address public bathAssetAddress;
    address public bathQuoteAddress;

    address public RubiconMarketAddress;

    mapping(address => uint[]) addressToHoldings;


    constructor () public {
        bathHouse = msg.sender;
    }

    // TODO: add onlyKeeper modifier while using permissioned keepers

    // initialize() -start the token 
    function initialize(address asset, string calldata assetName, address quote, string calldata quoteName, address market) external {
        require(msg.sender == bathHouse, "caller must be Bath House");
        underlyingAsset = asset;
        underlyingQuote = quote;

        //deploy new BathTokens:
        BathToken bathAsset = new BathToken(string(abi.encodePacked("bath", (assetName))), asset, market);
        bathAssetAddress = address(bathAsset);

        BathToken bathQuote = new BathToken(string(abi.encodePacked("bath", (quoteName))), quote, market);
        bathQuoteAddress = address(bathQuote);

        RubiconMarketAddress = market;
    }

    function deposit(address asset, uint assetAmount, address quote, uint quoteAmount) external returns (uint bathAssetAmount, uint bathQuoteAmount) {
        // require(bathTokens exist)
        require(asset != quote);
        require(asset == underlyingAsset, "wrong asset nerd");
        require(quote == underlyingQuote, "wrong quote nerd");

        // mint the bathTokens to the user in accordance to weights, send underlying assets to each Bath Token
        IERC20(asset).transferFrom(msg.sender, bathAssetAddress, assetAmount);
        IERC20(quote).transferFrom(msg.sender, bathQuoteAddress, quoteAmount);
        // _mint(msg.sender, amount);
        IBathToken(bathAssetAddress).mint(msg.sender, assetAmount);
        IBathToken(bathQuoteAddress).mint(msg.sender, quoteAmount);

        //filler for return values
        return (assetAmount, quoteAmount);
    }

    function withdraw(address asset, uint assetAmount, address quote, uint quoteAmount) external {
        require(asset != quote);
        require(asset == underlyingAsset, "wrong asset nerd");
        require(quote == underlyingQuote, "wrong quote nerd");

        require(IERC20(asset).balanceOf(bathAssetAddress) >= assetAmount, "Not enough underlying in bathToken");
        require(IERC20(quote).balanceOf(bathQuoteAddress) >= quoteAmount, "Not enough underlying in bathToken");

        //Return funds to users
        IBathToken(bathAssetAddress).withdraw(msg.sender, assetAmount);
        IBathToken(bathQuoteAddress).withdraw(msg.sender, quoteAmount);
    }

    function placePairsTrade(uint spread) external {

    }

}
