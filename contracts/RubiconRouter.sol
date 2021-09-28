// SPDX-License-Identifier: BUSL-1.1

/// @author Benjamin Hughes - Rubicon
/// @notice This contract is a router to interact with the low-level functions present in RubiconMarket and Pools
pragma solidity =0.7.6;

import "./RubiconMarket.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./peripheral_contracts/ABDKMath64x64.sol";

contract RubiconRouter {
    address public RubiconMarketAddress;
    //uint256 MAX_INT = 2**256 - 1
    event LogNote(string, uint256);

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
    function swapv0(
        uint256 pay_amt,
        uint256 buy_amt_min,
        address[] calldata route,
        uint256 expectedMarketFeeBPS
    ) public {
        //transfer needed amount here first
        ERC20(route[0]).transferFrom(
            msg.sender,
            address(this),
            pay_amt + (pay_amt * expectedMarketFeeBPS) / 10000
        );

        uint256 currentAmount = 0;
        for (uint256 i = 0; i < route.length - 1; i++) {
            (address input, address output) = (route[i], route[i + 1]);
            uint256 _pay = i == 0
                ? pay_amt
                : (currentAmount -
                    (currentAmount * expectedMarketFeeBPS) /
                    10000);

            // Approve exchange
            ERC20(input).approve(RubiconMarketAddress, 2**256 - 1);
            uint256 fillAmount = RubiconMarket(RubiconMarketAddress)
                .sellAllAmount(
                    ERC20(input),
                    _pay,
                    ERC20(output),
                    0 //naively assume no fill_amt here for loop purposes?
                );
            currentAmount = fillAmount;
        }
        require(currentAmount >= buy_amt_min, "didnt clear buy_amt_min");

        // send tokens back to sender
        ERC20(route[route.length - 1]).transfer(msg.sender, currentAmount);
    }
}
