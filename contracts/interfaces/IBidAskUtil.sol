// SPDX-License-Identifier: BUSL-1.1

// contract that employs user Bath liquidity to market make and pass yield to users
/// @author Benjamin Hughes
/// @notice This represents a Stoikov market-making model designed for Rubicon...
pragma solidity ^0.7.6;

interface IBidAskUtil {
    function execute(
        address underlyingAsset,
        address bathAssetAddress,
        address underlyingQuote,
        address bathQuoteAddress,
        uint256 askNumerator,
        uint256 askDenominator,
        uint256 bidNumerator,
        uint256 bidDenominator
    ) external;
}
