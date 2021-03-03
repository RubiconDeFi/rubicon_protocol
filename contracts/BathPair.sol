pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

//represents a stake in underlying liquidity of pair-based bath pool...

contract BathPair {

    address public bathHouse;
    address public underlyingAsset;
    address public underlyingQuote;
    // mint() - function that mints to the user a bathToken for this token's asset
    //     should only be callable from the BathHouse

    // ERC20 - token needs to adapt the ERC20 interface

    // burn() - need ability to burn bath tokens when a user withdraws liquidity from a pool
    mapping(address => uint[]) addressToHoldings;

    constructor () public {
        bathHouse = msg.sender;
    }

    // initialize() -start the token 
    function initialize(address asset, address quote) external {
        require(msg.sender == bathHouse, "caller must be Bath House");
        underlyingAsset = asset;
        underlyingQuote = quote;
    }

    function deposit(address asset, uint assetAmount, address quote, uint quoteAmount) external returns (uint newAmount) {
        // require(bathTokens exist)
        require(asset != quote);
        require(asset == underlyingAsset, "wrong asset nerd");
        require(quote == underlyingQuote, "wrong quote nerd");

        // mint the bathTokens to the user in accordance to weights, send underlying assets to each Bath Token
        IERC20(asset).transferFrom(msg.sender, address(this), assetAmount);
        IERC20(quote).transferFrom(msg.sender, address(this), quoteAmount);
        // _mint(msg.sender, amount);


        uint newAmount = 1;
        //filler for return values
        return newAmount;
    }

}

interface IBathToken {
    function initialize(address, address) external;

}