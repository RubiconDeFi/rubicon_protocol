// SPDX-License-Identifier: BUSL-1.1

/// @author Benjamin Hughes - Rubicon
/// @notice This contract is a router to interact with the low-level functions present in RubiconMarket and Pools
pragma solidity =0.7.6;

import "./RubiconMarket.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./peripheral_contracts/ABDKMath64x64.sol";
import "./peripheral_contracts/WETH9.sol"; // @unsupported: ovm
import "./rubiconPools/BathToken.sol";

///@dev this contract is a high-level router that utilizes Rubicon smart contracts to provide
///@dev added convenience and functionality when interacting with the Rubicon protocol
contract RubiconRouter {
    using SafeMath for uint256;

    address public RubiconMarketAddress;

    address payable public wethAddress;

    bool public started;

    event LogNote(string, uint256);

    event Swap(
        uint256 inputAmount,
        address inputERC20,
        uint256 hurdleBuyAmtMin,
        address targetERC20,
        uint256 realizedFill,
        address recipient
    );

    function startErUp(address _theTrap, address payable _weth) external {
        require(!started);
        RubiconMarketAddress = _theTrap;
        wethAddress = _weth;
        started = true;
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

    // function for infinite approvals of Rubicon Market
    function approveAssetOnMarket(address toApprove) public {
        // Approve exchange
        ERC20(toApprove).approve(RubiconMarketAddress, 2**256 - 1);
    }

    /// @dev this function takes the same parameters of swap and returns the expected amount
    function getExpectedSwapFill(
        uint256 pay_amt,
        uint256 buy_amt_min,
        address[] calldata route, // First address is what is being payed, Last address is what is being bought
        uint256 expectedMarketFeeBPS //20
    ) public view returns (uint256 fill_amt) {
        address _market = RubiconMarketAddress;
        uint256 currentAmount = 0;
        for (uint256 i = 0; i < route.length - 1; i++) {
            (address input, address output) = (route[i], route[i + 1]);
            uint256 _pay = i == 0
                ? pay_amt
                : (
                    currentAmount.sub(
                        currentAmount.mul(expectedMarketFeeBPS).div(10000)
                    )
                );
            uint256 wouldBeFillAmount = RubiconMarket(_market).getBuyAmount(
                ERC20(output),
                ERC20(input),
                _pay
            );
            currentAmount = wouldBeFillAmount;
        }
        require(currentAmount >= buy_amt_min, "didnt clear buy_amt_min");

        // Return the wouldbe resulting swap amount
        return (currentAmount);
    }

    /// @dev This function lets a user swap from route[0] -> route[last] at some minimum expected rate
    /// @dev pay_amt - amount to be swapped away from msg.sender of *first address in path*
    /// @dev buy_amt_min - target minimum received of *last address in path*
    function swap(
        uint256 pay_amt,
        uint256 buy_amt_min,
        address[] calldata route, // First address is what is being payed, Last address is what is being bought
        uint256 expectedMarketFeeBPS //20
    ) public returns (uint256) {
        //**User must approve this contract first**
        //transfer needed amount here first
        ERC20(route[0]).transferFrom(
            msg.sender,
            address(this),
            pay_amt.add(pay_amt.mul(expectedMarketFeeBPS).div(10000)) // Account for expected fee
        );
        return
            _swap(
                pay_amt,
                buy_amt_min,
                route,
                expectedMarketFeeBPS,
                msg.sender
            );
    }

    // Internal function requires that ERC20s are here before execution
    function _swap(
        uint256 pay_amt,
        uint256 buy_amt_min,
        address[] calldata route, // First address is what is being payed, Last address is what is being bought
        uint256 expectedMarketFeeBPS,
        address to // Recipient of swap outputs!
    ) internal returns (uint256) {
        address _market = RubiconMarketAddress;
        uint256 currentAmount = 0;
        for (uint256 i = 0; i < route.length - 1; i++) {
            (address input, address output) = (route[i], route[i + 1]);
            uint256 _pay = i == 0
                ? pay_amt
                : (
                    currentAmount.sub(
                        currentAmount.mul(expectedMarketFeeBPS).div(10000)
                    )
                );
            if (ERC20(input).allowance(address(this), _market) == 0) {
                approveAssetOnMarket(input);
            }
            uint256 fillAmount = RubiconMarket(_market).sellAllAmount(
                ERC20(input),
                _pay,
                ERC20(output),
                0 //naively assume no fill_amt here for loop purposes?
            );
            currentAmount = fillAmount;
        }
        require(currentAmount >= buy_amt_min, "didnt clear buy_amt_min");

        // send tokens back to sender
        ERC20(route[route.length - 1]).transfer(to, currentAmount);

        emit Swap(
            pay_amt,
            route[0],
            buy_amt_min,
            route[route.length - 1],
            currentAmount,
            to
        );
        return currentAmount;
    }

    /// @dev this function takes a user's entire balance for the trade in case they want to do a max trade so there's no leftover dust
    function swapEntireBalance(
        uint256 buy_amt_min,
        address[] calldata route, // First address is what is being payed, Last address is what is being bought
        uint256 expectedMarketFeeBPS
    ) external returns (uint256) {
        //swaps msg.sender entire balance in the trade
        uint256 maxAmount = ERC20(route[0]).balanceOf(msg.sender);
        ERC20(route[0]).transferFrom(
            msg.sender,
            address(this),
            maxAmount // Account for expected fee
        );
        return
            _swap(
                maxAmount,
                buy_amt_min,
                route,
                expectedMarketFeeBPS,
                msg.sender
            );
    }

    /// @dev this function takes a user's entire balance for the trade in case they want to do a max trade so there's no leftover dust
    function maxBuyAllAmount(
        ERC20 buy_gem,
        ERC20 pay_gem,
        uint256 max_fill_amount
    ) external returns (uint256 fill) {
        //swaps msg.sender's entire balance in the trade
        uint256 maxAmount = ERC20(buy_gem).balanceOf(msg.sender);
        fill = RubiconMarket(RubiconMarketAddress).buyAllAmount(
            buy_gem,
            maxAmount,
            pay_gem,
            max_fill_amount
        );
        ERC20(buy_gem).transfer(msg.sender, fill);
    }

    /// @dev this function takes a user's entire balance for the trade in case they want to do a max trade so there's no leftover dust
    function maxSellAllAmount(
        ERC20 pay_gem,
        ERC20 buy_gem,
        uint256 min_fill_amount
    ) external returns (uint256 fill) {
        //swaps msg.sender entire balance in the trade
        uint256 maxAmount = ERC20(buy_gem).balanceOf(msg.sender);
        fill = RubiconMarket(RubiconMarketAddress).sellAllAmount(
            pay_gem,
            maxAmount,
            buy_gem,
            min_fill_amount
        );
        ERC20(buy_gem).transfer(msg.sender, fill);
    }

    // ** Native ETH Wrapper Functions **
    /// @dev WETH wrapper functions to obfuscate WETH complexities from ETH holders
    function ETHbuyAllAmountP(
        ERC20 buy_gem,
        uint256 buy_amt,
        // ERC20 nativeETH,
        uint256 max_fill_amount
    ) external payable returns (uint256 fill) {
        require(
            msg.value >= max_fill_amount,
            "must send as much ETH as max_fill_amt"
        );
        WETH9(wethAddress).deposit{value: max_fill_amount}(); // Pay with native ETH -> WETH
        fill = RubiconMarket(RubiconMarketAddress).buyAllAmount(
            buy_gem,
            buy_amt,
            ERC20(wethAddress),
            max_fill_amount
        );
        ERC20(buy_gem).transfer(msg.sender, fill);
        return fill;
    }

    // Paying ERC20 to buy native ETH
    function ETHbuyAllAmountB(
        // ERC20 nativeETH,
        uint256 buy_amt,
        ERC20 pay_gem,
        uint256 max_fill_amount
    ) external returns (uint256 fill) {
        ERC20(pay_gem).transferFrom(msg.sender, address(this), max_fill_amount); //transfer pay here
        fill = RubiconMarket(RubiconMarketAddress).buyAllAmount(
            ERC20(wethAddress),
            buy_amt,
            pay_gem,
            max_fill_amount
        );
        WETH9(wethAddress).withdraw(fill); // Fill in WETH
        msg.sender.transfer(fill); // Return native ETH
        // Return unspent coins to sender
        if (max_fill_amount > fill) {
            ERC20(pay_gem).transfer(msg.sender, max_fill_amount - fill);
        }
        return fill;
    }

    // Pay in native ETH
    function WETHofferP(
        uint256 pay_amt, //maker (ask) sell how much
        // ERC20 nativeETH, //maker (ask) sell which token
        uint256 buy_amt, //maker (ask) buy how much
        ERC20 buy_gem, //maker (ask) buy which token
        uint256 pos //position to insert offer, 0 should be used if unknown
    ) external payable returns (uint256) {
        require(
            msg.value >= pay_amt,
            "didnt send enough native ETH for WETH offer"
        );
        uint256 _before = ERC20(buy_gem).balanceOf(address(this));
        WETH9(wethAddress).deposit{value: pay_amt}();
        uint256 id = RubiconMarket(RubiconMarketAddress).offer(
            pay_amt,
            ERC20(wethAddress),
            buy_amt,
            buy_gem,
            pos
        );
        uint256 _after = ERC20(buy_gem).balanceOf(address(this));
        if (_after > _before) {
            //return any potential fill amount on the offer
            ERC20(buy_gem).transfer(msg.sender, _after - _before);
        }
        return id;
    }

    // Pay in native ETH
    function WETHofferB(
        uint256 pay_amt, //maker (ask) sell how much
        ERC20 pay_gem, //maker (ask) sell which token
        uint256 buy_amt, //maker (ask) buy how much
        // ERC20 nativeETH, //maker (ask) buy which token
        uint256 pos //position to insert offer, 0 should be used if unknown
    ) external returns (uint256) {
        ERC20(pay_gem).transferFrom(msg.sender, address(this), pay_amt);

        uint256 _before = ERC20(wethAddress).balanceOf(address(this));
        uint256 id = RubiconMarket(RubiconMarketAddress).offer(
            pay_amt,
            pay_gem,
            buy_amt,
            ERC20(wethAddress),
            pos
        );
        uint256 _after = ERC20(wethAddress).balanceOf(address(this));
        if (_after > _before) {
            //return any potential fill amount on the offer as native ETH
            uint256 delta = _after - _before;
            WETH9(wethAddress).withdraw(delta);
            msg.sender.transfer(delta);
        }
        return id;
    }

    // Cancel an offer made in WETH
    function ETHcancel(uint256 id) external returns (bool outcome) {
        (uint256 pay_amt, ERC20 pay_gem, , ) = RubiconMarket(
            RubiconMarketAddress
        ).getOffer(id);
        require(
            address(pay_gem) == wethAddress,
            "trying to cancel a non WETH order"
        );
        // Cancel order and receive WETH here in amount of pay_amt
        outcome = RubiconMarket(RubiconMarketAddress).cancel(id);
        WETH9(wethAddress).withdraw(pay_amt);
        msg.sender.transfer(pay_amt);
    }

    // Deposit native ETH -> WETH pool
    function ETHdeposit(uint256 amount, address targetPool)
        external
        payable
        returns (uint256 newShares)
    {
        IERC20 target = BathToken(targetPool).underlyingToken();
        require(target == ERC20(wethAddress), "target pool not weth pool");
        require(msg.value >= amount, "didnt send enough eth");
        WETH9(wethAddress).deposit{value: amount}();
        newShares = BathToken(targetPool).deposit(amount);
        //Send back bathTokens to sender
        ERC20(targetPool).transfer(msg.sender, newShares);
    }

    // Withdraw native ETH <- WETH pool
    function ETHwithdraw(uint256 shares, address targetPool)
        external
        payable
        returns (uint256 withdrawnWETH)
    {
        IERC20 target = BathToken(targetPool).underlyingToken();
        require(target == ERC20(wethAddress), "target pool not weth pool");
        require(
            BathToken(targetPool).balanceOf(msg.sender) >= shares,
            "didnt send enough shares"
        );
        withdrawnWETH = BathToken(targetPool).withdraw(shares);
        WETH9(wethAddress).withdraw(withdrawnWETH);
        //Send back withdrawn native eth to sender
        msg.sender.transfer(withdrawnWETH);
    }

    function swapWithETH(
        uint256 pay_amt,
        uint256 buy_amt_min,
        address[] calldata route, // First address is what is being payed, Last address is what is being bought
        uint256 expectedMarketFeeBPS
    ) external payable returns (uint256) {
        require(route[0] == wethAddress);
        require(msg.value >= pay_amt, "must send native ETH to pay as weth");
        WETH9(wethAddress).deposit{value: pay_amt}();
        return
            _swap(
                pay_amt,
                buy_amt_min,
                route,
                expectedMarketFeeBPS,
                msg.sender
            );
    }

    function swapForETH(
        uint256 pay_amt,
        uint256 buy_amt_min,
        address[] calldata route, // First address is what is being payed, Last address is what is being bought
        uint256 expectedMarketFeeBPS
    ) external returns (uint256 fill) {
        require(
            route[route.length - 1] == wethAddress,
            "target of swap is not WETH"
        );
        fill = _swap(
            pay_amt,
            buy_amt_min,
            route,
            expectedMarketFeeBPS,
            address(this)
        );

        WETH9(wethAddress).withdraw(fill);
        msg.sender.transfer(fill);
    }
}
