// SPDX-License-Identifier: BUSL-1.1

/// @author Benjamin Hughes - Rubicon
/// @notice This contract is a router to interact with the low-level functions present in RubiconMarket and Pools
pragma solidity =0.7.6;

import "./RubiconMarket.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./peripheral_contracts/ABDKMath64x64.sol";

contract RubiconRouter {
    address public RubiconMarketAddress;

    constructor(address _rM) {
        RubiconMarketAddress = _rM;
    }

    /// @dev this function returns the best offer for a pair's id and info
    function getBestOfferAndInfo(address asset, address quote)
        public
        view
        returns (
            uint256, //id
            uint256,
            ERC20,
            uint256,
            ERC20
        )
    {
        address _market = RubiconMarketAddress;
        uint256 offer = RubiconMarket(_market).getBestOffer(
            ERC20(asset),
            ERC20(quote)
        );
        (
            uint256 pay_amt,
            ERC20 pay_gem,
            uint256 buy_amt,
            ERC20 buy_gem
        ) = RubiconMarket(_market).getOffer(offer);
        return (offer, pay_amt, pay_gem, buy_amt, buy_gem);
    }

    /// @dev route - should represent the addresses throught which pay_amt moves
    /// @dev buy_amt_min - should represent the addresses throught which pay_amt moves
    function swap(
        uint256 pay_amt,
        address pay_gem,
        uint256 buy_amt_min,
        address buy_gem,
        address[] calldata route
    ) public {
        // TODO: length requirement?
        // TODO: ensure the route is valid...
        require(
            route[route.length - 1] == buy_gem,
            "last step in the route is not buy_gem"
        );
        address _market = RubiconMarketAddress;
        uint256 currentAmount = 0;
        for (uint256 i = 0; i < route.length - 1; i++) {
            (address input, address output) = (route[i], route[i + 1]);
            // uint _pay = pay_amt;
            uint256 _pay = i == 0 ? pay_amt : currentAmount;
            uint256 fillAmount = RubiconMarket(_market).sellAllAmount(
                ERC20(input),
                _pay,
                ERC20(output),
                0 //naively assume no fill_amt here for loop purposes?
            );
            currentAmount = fillAmount;
        }
        require(currentAmount >= buy_amt_min);
    }
}
