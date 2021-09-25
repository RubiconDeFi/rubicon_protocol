// SPDX-License-Identifier: BUSL-1.1

/// @author Benjamin Hughes - Rubicon
/// @notice This contract allows a strategist to use user funds in order to market make for a Rubicon pair
/// @notice The BathPair is the admin for the pair's liquidity and has many security checks in place
/// @notice This contract is also where strategists claim rewards for successful market making

pragma solidity =0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./BathToken.sol";
import "./BathHouse.sol";
import "../RubiconMarket.sol";
import "../peripheral_contracts/ABDKMath64x64.sol";

contract BathPair {
    using SafeMath for uint256;

    address public bathHouse;
    address public underlyingAsset;
    address public underlyingQuote;

    address public bathAssetAddress;
    address public bathQuoteAddress;

    address public RubiconMarketAddress;

    bool public initialized;

    int128 internal shapeCoefNum;
    uint256 public maxOrderSizeBPS;

    /// @dev Internal variables for localalized searching in bathScrub
    uint256 internal start;
    uint256 internal searchRadius;

    uint256 internal totalAssetFills;
    uint256 internal totalQuoteFills;

    /// @dev [askID, ask.pay_amt, bidID, bid.pay_amt, timestamp]
    StrategistTrade[] public outstandingPairIDs;

    /// @dev Maps a trade ID to each of their strategists for rewards purposes
    mapping(address => uint256) public strategist2FillsAsset;
    mapping(address => uint256) public strategist2FillsQuote;

    struct order {
        uint256 pay_amt;
        ERC20 pay_gem;
        uint256 buy_amt;
        ERC20 buy_gem;
    }

    struct StrategistTrade {
        uint256 askId;
        uint256 askAmt;
        uint256 bidId;
        uint256 bidAmt;
        uint256 timestamp;
        address strategist;
    }

    event LogStrategistTrade(
        uint256 askId,
        uint256 askAmt,
        uint256 bidId,
        uint256 bidAmt,
        uint256 timestamp,
        address strategist
    );

    event StrategistRewardClaim(
        address strategist,
        address asset,
        uint256 amountOfReward,
        uint256 timestamp
    );

    /// @dev Proxy-safe initialization of storage
    function initialize(
        address _bathAssetAddress,
        address _bathQuoteAddress,
        address _bathHouse,
        uint256 _maxOrderSizeBPS,
        int128 _shapeCoefNum
    ) external {
        require(!initialized);
        bathHouse = _bathHouse;

        bathAssetAddress = _bathAssetAddress;
        bathQuoteAddress = _bathQuoteAddress;

        require(
            BathToken(bathAssetAddress).underlying() !=
                address(0x0000000000000000000000000000000000000000)
        );
        require(
            BathToken(bathQuoteAddress).underlying() !=
                address(0x0000000000000000000000000000000000000000)
        );
        underlyingAsset = BathToken(bathAssetAddress).underlying();
        underlyingQuote = BathToken(bathQuoteAddress).underlying();

        require(
            BathHouse(bathHouse).getMarket() !=
                address(0x0000000000000000000000000000000000000000)
        );
        RubiconMarketAddress = BathHouse(bathHouse).getMarket();

        maxOrderSizeBPS = _maxOrderSizeBPS;
        shapeCoefNum = _shapeCoefNum;
        start = 0;
        searchRadius = 2;
        initialized = true;
    }

    modifier onlyBathHouse() {
        require(msg.sender == bathHouse);
        _;
    }

    modifier onlyApprovedStrategist(address targetStrategist) {
        require(
            BathHouse(bathHouse).isApprovedStrategist(targetStrategist) == true,
            "you are not an approved strategist - bathPair"
        );
        _;
    }

    modifier enforceReserveRatio() {
        _;
        require(
            (
                BathToken(bathAssetAddress).totalSupply().mul(
                    BathHouse(bathHouse).reserveRatio()
                )
            )
            .div(100) <= IERC20(underlyingAsset).balanceOf(bathAssetAddress)
        );
        require(
            (
                BathToken(bathQuoteAddress).totalSupply().mul(
                    BathHouse(bathHouse).reserveRatio()
                )
            )
            .div(100) <= IERC20(underlyingQuote).balanceOf(bathQuoteAddress)
        );
    }

    function setMaxOrderSizeBPS(uint16 val) external onlyBathHouse {
        maxOrderSizeBPS = val;
    }

    function setShapeCoefNum(int128 val) external onlyBathHouse {
        shapeCoefNum = val;
    }

    function setSearchRadius(uint256 val) external onlyBathHouse {
        searchRadius = val;
    }

    function getThisBathQuote() external view returns (address) {
        require(initialized);
        return bathQuoteAddress;
    }

    function getThisBathAsset() external view returns (address) {
        require(initialized);
        return bathAssetAddress;
    }

    function getOutstandingPairCount() external view returns (uint256) {
        return outstandingPairIDs.length;
    }

    function getSearchRadius() external view returns (uint256) {
        return searchRadius;
    }

    // *** Internal Functions ***

    function getMidpointPrice() internal view returns (int128) {
        address _RubiconMarketAddress = RubiconMarketAddress;
        uint256 bestAskID = RubiconMarket(_RubiconMarketAddress).getBestOffer(
            ERC20(underlyingAsset),
            ERC20(underlyingQuote)
        );
        uint256 bestBidID = RubiconMarket(_RubiconMarketAddress).getBestOffer(
            ERC20(underlyingQuote),
            ERC20(underlyingAsset)
        );
        // Throw a zero if unable to determine midpoint from the book
        if (bestAskID == 0 || bestBidID == 0) {
            return 0;
        }
        order memory bestAsk = getOfferInfo(bestAskID);
        order memory bestBid = getOfferInfo(bestBidID);
        int128 midpoint = ABDKMath64x64.divu(
            (
                (bestAsk.buy_amt.div(bestAsk.pay_amt)).add(
                    bestBid.pay_amt.div(bestBid.buy_amt)
                )
            ),
            2
        );
        return midpoint;
    }

    // orderID of the fill
    // only log fills for each strategist - needs to be asset specific
    // isAssetFill are *quotes* that result in asset yield
    function logFill(
        uint256 amt,
        bool isAssetFill,
        address sender
    ) internal {
        // Goal is to map a fill to a strategist
        if (isAssetFill) {
            strategist2FillsAsset[sender] += amt;
            totalAssetFills += amt;
        } else {
            strategist2FillsQuote[sender] += amt;
            totalQuoteFills += amt;
        }
    }

    function removeElement(uint256 index) internal {
        outstandingPairIDs[index] = outstandingPairIDs[
            outstandingPairIDs.length - 1
        ];
        outstandingPairIDs.pop();
    }

    function handleStratOrderAtIndex(uint256 index) internal {
        StrategistTrade memory info = outstandingPairIDs[index];
        order memory offer1 = getOfferInfo(info.askId); //ask
        order memory offer2 = getOfferInfo(info.bidId); //bid
        uint256 askDelta = info.askAmt - offer1.pay_amt;
        uint256 bidDelta = info.bidAmt - offer2.pay_amt;

        // if real
        if (info.askId != 0) {
            // if delta > 0 - delta is fill => handle any amount of fill here
            if (askDelta > 0) {
                logFill(askDelta, true, info.strategist);
                BathToken(bathAssetAddress).removeFilledTradeAmount(askDelta);
                // not a full fill
                if (askDelta != info.askAmt) {
                    BathToken(bathAssetAddress).cancel(
                        info.askId,
                        info.askAmt.sub(askDelta)
                    );
                }
            }
            // otherwise didn't fill so cancel
            else {
                BathToken(bathAssetAddress).cancel(info.askId, info.askAmt); // pas amount too
            }
        }

        // if real
        if (info.bidId != 0) {
            // if delta > 0 - delta is fill => handle any amount of fill here
            if (bidDelta > 0) {
                logFill(bidDelta, false, info.strategist);
                BathToken(bathQuoteAddress).removeFilledTradeAmount(bidDelta);
                // not a full fill
                if (bidDelta != info.bidAmt) {
                    BathToken(bathQuoteAddress).cancel(
                        info.bidId,
                        info.bidAmt.sub(bidDelta)
                    );
                }
            }
            // otherwise didn't fill so cancel
            else {
                BathToken(bathQuoteAddress).cancel(info.bidId, info.bidAmt); // pass amount too
            }
        }
    }

    // Get offer info from Rubicon Market
    function getOfferInfo(uint256 id) internal view returns (order memory) {
        (
            uint256 ask_amt,
            ERC20 ask_gem,
            uint256 bid_amt,
            ERC20 bid_gem
        ) = RubiconMarket(RubiconMarketAddress).getOffer(id);
        order memory offerInfo = order(ask_amt, ask_gem, bid_amt, bid_gem);
        return offerInfo;
    }

    // *** External functions that can be called by Strategists ***

    function executeStrategy(
        uint256 askNumerator, // Quote / Asset
        uint256 askDenominator, // Asset / Quote
        uint256 bidNumerator, // size in ASSET
        uint256 bidDenominator // size in QUOTES
    ) external enforceReserveRatio onlyApprovedStrategist(msg.sender) {
        // Require at least one order is non-zero
        require(
            (askNumerator > 0 && askDenominator > 0) ||
                (bidNumerator > 0 && bidDenominator > 0)
        );
        address _underlyingAsset = underlyingAsset;
        address _underlyingQuote = underlyingQuote;
        address _bathAssetAddress = bathAssetAddress;
        address _bathQuoteAddress = bathQuoteAddress;
        address _bathHouse = bathHouse;

        // Enforce dynamic ordersizing and inventory management
        require(
            askNumerator <=
                getMaxOrderSize(_underlyingAsset, _bathAssetAddress),
            "ask too large"
        );
        require(
            bidNumerator <=
                getMaxOrderSize(_underlyingQuote, _bathQuoteAddress),
            "bid too large"
        );

        // Enforce that the bath is scrubbed for outstanding pairs
        require(
            outstandingPairIDs.length <
                BathHouse(_bathHouse).maxOutstandingPairCount(),
            "too many outstanding pairs, please call bathScrub() first"
        );
        require(
            (askNumerator > 0 && askDenominator > 0) ||
                (bidNumerator > 0 && bidDenominator > 0),
            "one order must be non-zero"
        );

        // Calculate new bid and/or ask
        order memory ask = order(
            askNumerator,
            ERC20(_underlyingAsset),
            askDenominator,
            ERC20(_underlyingQuote)
        );
        order memory bid = order(
            bidNumerator,
            ERC20(underlyingQuote),
            bidDenominator,
            ERC20(underlyingAsset)
        );

        // Place new bid and/or ask
        uint256 newAskID = BathToken(bathAssetAddress).placeOffer(
            ask.pay_amt,
            ask.pay_gem,
            ask.buy_amt,
            ask.buy_gem
        );

        uint256 newBidID = BathToken(bathQuoteAddress).placeOffer(
            bid.pay_amt,
            bid.pay_gem,
            bid.buy_amt,
            bid.buy_gem
        );

        // Strategist trade is recorded so they can get paid and the trade is logged for time
        StrategistTrade memory outgoing = StrategistTrade(
            newAskID,
            ask.pay_amt,
            newBidID,
            bid.pay_amt,
            block.timestamp,
            msg.sender
        );
        outstandingPairIDs.push(outgoing);

        emit LogStrategistTrade(
            outgoing.askId,
            outgoing.askAmt,
            outgoing.bidId,
            outgoing.bidAmt,
            outgoing.timestamp,
            outgoing.strategist
        );
    }

    // Returns filled liquidity to the correct bath pool - enforce this on permissionless
    function rebalancePair() public {
        address _bathAssetAddress = bathAssetAddress;
        address _bathQuoteAddress = bathQuoteAddress;
        address _underlyingAsset = underlyingAsset;
        address _underlyingQuote = underlyingQuote;
        uint256 bathAssetYield = ERC20(_underlyingQuote).balanceOf(
            _bathAssetAddress
        );
        uint256 bathQuoteYield = ERC20(_underlyingAsset).balanceOf(
            _bathQuoteAddress
        );
        uint16 stratReward = BathHouse(bathHouse).getBPSToStrats(address(this));
        if (bathAssetYield > 0) {
            BathToken(_bathAssetAddress).rebalance(
                _bathQuoteAddress,
                _underlyingQuote,
                stratReward
            );
        }

        if (bathQuoteYield > 0) {
            BathToken(_bathQuoteAddress).rebalance(
                _bathAssetAddress,
                _underlyingAsset,
                stratReward
            );
        }
    }

    // This function cleans outstanding orders on a time basis and rebalances yield between bathTokens
    function bathScrub() external {
        uint256 timeDelay = BathHouse(bathHouse).timeDelay();
        uint256 len = outstandingPairIDs.length;
        uint256 _start = start;

        uint256 _searchRadius = searchRadius;
        if (_start + _searchRadius >= len) {
            // start over from beggining
            if (_searchRadius >= len) {
                _start = 0;
                _searchRadius = len;
            } else {
                _searchRadius = len - _start;
            }
        }

        for (uint256 x = _start; x < _start + _searchRadius; x++) {
            if (
                outstandingPairIDs[x].timestamp < (block.timestamp - timeDelay)
            ) {
                handleStratOrderAtIndex(x);

                removeElement(x);
                x--;
                _searchRadius--;
            }
        }
        if (_start + searchRadius >= len) {
            start = 0;
        } else {
            start = _start + searchRadius;
        }
    }

    // Inputs are indices through which to scrub
    // Zero indexed indices!
    function indexScrub(uint8 _start, uint8 _end)
        external
        onlyApprovedStrategist(msg.sender)
    {
        uint256 len = outstandingPairIDs.length;
        uint256 delta = len - 1 - _end;
        require(
            _end - _start <= len,
            "range of indices too great for outstandingPairs length"
        );
        for (uint8 x = _start; x <= _end; x++) {
            handleStratOrderAtIndex(x);

            //delta is indices delta from _end through end of array
            if (delta > 0) {
                removeElement(x);
                delta--;
            } else if (x < _end) {
                removeElement(x);
                x--;
                _end--;
            } else if (x == _end) {
                outstandingPairIDs.pop();
            }
        }
    }

    // Return the largest order size that can be placed as a strategist for given asset and liquidity pool
    function getMaxOrderSize(address asset, address bathTokenAddress)
        public
        view
        returns (uint256 maxOrderSize)
    {
        address _underlyingAsset = underlyingAsset;
        address _underlyingQuote = underlyingQuote;
        require(asset == _underlyingAsset || asset == _underlyingQuote);
        int128 shapeCoef = ABDKMath64x64.div(shapeCoefNum, 1000);

        uint256 underlyingBalance = IERC20(asset).balanceOf(bathTokenAddress);
        require(
            underlyingBalance > 0,
            "no bathToken liquidity to calculate max orderSize permissable"
        );

        // If no midpoint in book, allow **permissioned** strategist to maxOrderSize
        int128 midpoint = getMidpointPrice();
        if (midpoint == 0) {
            return maxOrderSizeBPS.mul(underlyingBalance).div(10000);
        }
        // if the asset/quote is overweighted: underlyingBalance / (Proportion of quote allocated to pair) * underlyingQuote balance
        if (asset == _underlyingAsset) {
            int128 ratio = ABDKMath64x64.divu(
                underlyingBalance,
                IERC20(_underlyingQuote).balanceOf(bathQuoteAddress)
            );
            if (ABDKMath64x64.mul(ratio, midpoint) > (2**64)) {
                // bid at maxSize
                return maxOrderSizeBPS.mul(underlyingBalance).div(10000);
            } else {
                // return dynamic order size
                uint256 maxSize = maxOrderSizeBPS.mul(underlyingBalance).div(
                    10000
                );
                int128 shapeFactor = ABDKMath64x64.exp(
                    ABDKMath64x64.mul(
                        shapeCoef,
                        ABDKMath64x64.inv(ABDKMath64x64.mul(ratio, midpoint))
                    )
                );
                uint256 dynamicSize = ABDKMath64x64.mulu(shapeFactor, maxSize);
                return dynamicSize;
            }
        } else if (asset == _underlyingQuote) {
            int128 ratio = ABDKMath64x64.divu(
                underlyingBalance,
                IERC20(_underlyingAsset).balanceOf(bathAssetAddress)
            );
            if (ABDKMath64x64.div(ratio, midpoint) > (2**64)) {
                return maxOrderSizeBPS.mul(underlyingBalance).div(10000);
            } else {
                // return dynamic order size
                uint256 maxSize = maxOrderSizeBPS.mul(underlyingBalance).div(
                    10000
                );
                int128 shapeFactor = ABDKMath64x64.exp(
                    ABDKMath64x64.mul(
                        shapeCoef,
                        ABDKMath64x64.inv(ABDKMath64x64.div(ratio, midpoint))
                    )
                );
                uint256 dynamicSize = ABDKMath64x64.mulu(shapeFactor, maxSize);
                return dynamicSize;
            }
        }
    }

    // This function allows a strategist to remove Pools liquidity from the order book from a trade id
    function removeLiquidity(uint256 id) external {
        require(id != 0, "cant remove a zero order");
        order memory ord = getOfferInfo(id);
        if (ord.pay_gem == ERC20(underlyingAsset)) {
            uint256 len = outstandingPairIDs.length;
            for (uint256 x = 0; x < len; x++) {
                if (outstandingPairIDs[x].askId == id) {
                    require(
                        msg.sender == outstandingPairIDs[x].strategist,
                        "only strategist can cancel their orders"
                    );
                    handleStratOrderAtIndex(x);
                    removeElement(x);
                    break;
                }
            }
        } else if (ord.pay_gem == ERC20(underlyingQuote)) {
            uint256 len = outstandingPairIDs.length;
            for (uint256 x = 0; x < len; x++) {
                if (outstandingPairIDs[x].bidId == id) {
                    require(
                        msg.sender == outstandingPairIDs[x].strategist,
                        "only strategist can cancel their orders"
                    );
                    handleStratOrderAtIndex(x);
                    removeElement(x);
                    break;
                }
            }
        }
    }

    // function where strategists claim rewards proportional to their quantity of fills
    function strategistBootyClaim() external {
        uint256 fillCountA = strategist2FillsAsset[msg.sender];
        uint256 fillCountQ = strategist2FillsQuote[msg.sender];
        if (fillCountA > 0) {
            uint256 booty = (
                fillCountA.mul(ERC20(underlyingAsset).balanceOf(address(this)))
            )
            .div(totalAssetFills);
            IERC20(underlyingAsset).transfer(msg.sender, booty);
            emit StrategistRewardClaim(
                msg.sender,
                underlyingAsset,
                booty,
                block.timestamp
            );
            totalAssetFills -= fillCountA;
            strategist2FillsAsset[msg.sender] -= fillCountA;
        }
        if (fillCountQ > 0) {
            uint256 booty = (
                fillCountQ.mul(ERC20(underlyingQuote).balanceOf(address(this)))
            )
            .div(totalQuoteFills);
            IERC20(underlyingQuote).transfer(msg.sender, booty);
            emit StrategistRewardClaim(
                msg.sender,
                underlyingQuote,
                booty,
                block.timestamp
            );
            totalQuoteFills -= fillCountQ;
            strategist2FillsQuote[msg.sender] -= fillCountQ;
        }
    }
}
