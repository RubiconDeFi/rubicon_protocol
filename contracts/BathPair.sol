pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./BathToken.sol";

contract BathPair {

    address public bathHouse;
    address public underlyingAsset;
    address public underlyingQuote;

    address public bathAssetAddress;
    address public bathQuoteAddress;

    mapping(address => uint[]) addressToHoldings;


    constructor () public {
        bathHouse = msg.sender;
    }

    // initialize() -start the token 
    function initialize(address asset, string calldata assetName, address quote, string calldata quoteName) external {
        require(msg.sender == bathHouse, "caller must be Bath House");
        underlyingAsset = asset;
        underlyingQuote = quote;

        //deploy new BathTokens:
        BathToken bathAsset = new BathToken(string(abi.encodePacked("bath", (assetName))));
        bathAssetAddress = address(bathAsset);

        BathToken bathQuote = new BathToken(string(abi.encodePacked("bath", (quoteName))));
        bathQuoteAddress = address(bathQuote);

    }

    function deposit(address asset, uint assetAmount, address quote, uint quoteAmount) external returns (uint bathAssetAmount, uint bathQuoteAmount) {
        // require(bathTokens exist)
        require(asset != quote);
        require(asset == underlyingAsset, "wrong asset nerd");
        require(quote == underlyingQuote, "wrong quote nerd");

        // mint the bathTokens to the user in accordance to weights, send underlying assets to each Bath Token
        IERC20(asset).transferFrom(msg.sender, address(this), assetAmount);
        IERC20(quote).transferFrom(msg.sender, address(this), quoteAmount);
        // _mint(msg.sender, amount);
        IBathToken(bathAssetAddress).mint(msg.sender, assetAmount);
        IBathToken(bathQuoteAddress).mint(msg.sender, quoteAmount);

        //filler for return values
        return (assetAmount, quoteAmount);
    }

}
