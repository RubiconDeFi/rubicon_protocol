/// @author Benjamin Hughes - Rubicon
/// @notice This contract allows a strategist to use user funds in order to market make for a Rubicon pair
/// @notice The BathPair is the admin for the pair's liquidity and has many security checks in place
/// @notice This contract is also where strategists claim rewards for successful market making

pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./BathToken.sol";
import "./BathHouse.sol";
import "../RubiconMarket.sol";
import "../peripheral_contracts/SafeMathE.sol";
import "../interfaces/IPairsTrade.sol";
import "../peripheral_contracts/ABDKMath64x64.sol";

contract BathPair {
    address public bathHouse;
    address public underlyingAsset;
    address public underlyingQuote;

    address public bathAssetAddress;
    address public bathQuoteAddress;

    address public RubiconMarketAddress;

    bool public initialized;

    uint256 internal totalAssetFills;
    uint256 internal totalQuoteFills;

    // askID, bidID, timestamp
    uint256[3][] public outstandingPairIDs;

    event LogTrade(uint256, ERC20, uint256, ERC20);
    event LogNote(string, uint256);
    event LogNoteI(string, int128);

    // Maps a trade ID to each of their strategists for rewards purposes
    mapping(uint256 => address) public IDs2strategist;
    mapping(address => uint256) public strategist2FillsAsset;
    mapping(address => uint256) public strategist2FillsQuote;

    struct order {
        uint256 pay_amt;
        ERC20 pay_gem;
        uint256 buy_amt;
        ERC20 buy_gem;
    }

    // constructor called to initialize a new Pair
    function initialize(
        address _bathAssetAddress,
        address _bathQuoteAddress,
        address _bathHouse
    ) public {
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
        initialized = true;
    }

    modifier onlyBathHouse {
        require(msg.sender == bathHouse);
        _;
    }

    modifier onlyApprovedStrategy(address targetStrategy) {
        require(
            BathHouse(bathHouse).isApprovedStrat(targetStrategy) == true,
            "not an approved strategy - bathPair"
        );
        _;
    }

    modifier enforceReserveRatio {
        require(
            (BathToken(bathAssetAddress).totalSupply() *
                BathHouse(bathHouse).reserveRatio()) /
                100 <=
                IERC20(underlyingAsset).balanceOf(bathAssetAddress)
        );
        require(
            (BathToken(bathQuoteAddress).totalSupply() *
                BathHouse(bathHouse).reserveRatio()) /
                100 <=
                IERC20(underlyingQuote).balanceOf(bathQuoteAddress)
        );
        _;
        require(
            (BathToken(bathAssetAddress).totalSupply() *
                BathHouse(bathHouse).reserveRatio()) /
                100 <=
                IERC20(underlyingAsset).balanceOf(bathAssetAddress)
        );
        require(
            (BathToken(bathQuoteAddress).totalSupply() *
                BathHouse(bathHouse).reserveRatio()) /
                100 <=
                IERC20(underlyingQuote).balanceOf(bathQuoteAddress)
        );
    }

    // TODO: enforce oracle sanity check to avoid order book manipulation before permissionless strategists
    function getMidpointPrice() internal returns (int128) {
        uint256 bestAskID =
            RubiconMarket(RubiconMarketAddress).getBestOffer(
                ERC20(underlyingAsset),
                ERC20(underlyingQuote)
            );
        uint256 bestBidID =
            RubiconMarket(RubiconMarketAddress).getBestOffer(
                ERC20(underlyingQuote),
                ERC20(underlyingAsset)
            );

        order memory bestAsk = getOfferInfo(bestAskID);
        order memory bestBid = getOfferInfo(bestBidID);
        int128 midpoint =
            ABDKMath64x64.divu(
                ((bestAsk.buy_amt / bestAsk.pay_amt) +
                    (bestBid.pay_amt / bestBid.buy_amt)),
                2
            );
        // ((bestAsk.buy_amt / bestAsk.pay_amt) +
        //     (bestBid.pay_amt / bestBid.buy_amt)) / 2;
        emit LogNoteI("midpoint calculated:", midpoint);
        return midpoint;
    }

    // Takes the proposed bid and ask as a parameter - ensures that there is a spread and that ask price > best bid and
    // bid price > best ask
    function enforceSpread(
        uint256 askN,
        uint256 askD,
        uint256 bidN,
        uint256 bidD
    ) internal view {
        // A spread must exist: (askN / askD) < (bidN / bidD)
        require(
            (askN * bidD) < (bidN * askD),
            "there is not a spread on strategist's pair trade"
        );
        uint256 bestAskID =
            RubiconMarket(RubiconMarketAddress).getBestOffer(
                ERC20(underlyingAsset),
                ERC20(underlyingQuote)
            );
        uint256 bestBidID =
            RubiconMarket(RubiconMarketAddress).getBestOffer(
                ERC20(underlyingQuote),
                ERC20(underlyingAsset)
            );

        order memory bestAsk = getOfferInfo(bestAskID);
        order memory bestBid = getOfferInfo(bestBidID);

        // Goal is for (askNumerator / askDenominator) < (bestBid.buy_amt / bestBid.pay_amt)
        // Therefore: askNumerator * bestBid.pay_amt < bestBid.buy_amt * askDenominator
        require(
            (askN * bestBid.pay_amt) < (bestBid.buy_amt * askD),
            "ask price is not greater than the best bid"
        );

        // Goal is for (bestAsk.pay_amt / bestAsk.buy_amt) < (bidNumerator / bidDenominator)
        // Therefore: bestAskNumerator * bidDenominator < bidNumerator * bestAskDenominator
        require(
            (bestAsk.pay_amt * bidD) < (bestAsk.buy_amt * bidN),
            "bid price is not less than the best ask"
        );
    }

    function getThisBathQuote() external view returns (address) {
        return bathQuoteAddress;
    }

    function getThisBathAsset() external view returns (address) {
        return bathAssetAddress;
    }

    // Returns filled liquidity to the correct bath pool
    function rebalancePair() internal {
        uint256 bathAssetYield =
            ERC20(underlyingQuote).balanceOf(bathAssetAddress);
        uint256 bathQuoteYield =
            ERC20(underlyingAsset).balanceOf(bathQuoteAddress);
        uint8 stratReward = BathHouse(bathHouse).getPropToStrats(address(this));
        if (bathAssetYield > 0) {
            BathToken(bathAssetAddress).rebalance(
                bathQuoteAddress,
                underlyingQuote,
                stratReward
            );
        }

        if (bathQuoteYield > 0) {
            BathToken(bathQuoteAddress).rebalance(
                bathAssetAddress,
                underlyingAsset,
                stratReward
            );
        }
    }

    // function where strategists claim rewards proportional to their quantity of fills
    function strategistBootyClaim() external {
        uint256 fillCountA = strategist2FillsAsset[msg.sender];
        uint256 fillCountQ = strategist2FillsQuote[msg.sender];
        if (fillCountA > 0) {
            uint256 booty =
                (fillCountA * ERC20(underlyingAsset).balanceOf(address(this))) /
                    totalAssetFills;
            IERC20(underlyingAsset).transfer(msg.sender, booty);
            totalAssetFills -= fillCountA;
        }
        if (fillCountQ > 0) {
            uint256 booty =
                (fillCountQ * ERC20(underlyingQuote).balanceOf(address(this))) /
                    totalQuoteFills;
            IERC20(underlyingQuote).transfer(msg.sender, booty);
            totalQuoteFills -= fillCountQ;
        }
    }

    function addOutstandingPair(uint256[3] calldata IDPair)
        external
        onlyApprovedStrategy(msg.sender)
    {
        require(IDPair.length == 3);
        outstandingPairIDs.push(IDPair);
    }

    // orderID of the fill
    // only log fills for each strategist - needs to be asset specific
    // isAssetFill are *quotes* that result in asset yield
    function logFill(uint256 orderID, bool isAssetFill) internal {
        // Goal is to map a fill to a strategist
        address strategist = IDs2strategist[orderID];
        if (isAssetFill) {
            strategist2FillsAsset[strategist] += 1;
            totalAssetFills += 1;
            // emit LogNote("logFill asset", totalAssetFills);
        } else {
            strategist2FillsQuote[strategist] += 1;
            totalQuoteFills += 1;
            // emit LogNote("logFill quote", totalQuoteFills);
        }
    }

    function removeElement(uint index) internal {
        outstandingPairIDs[index] = outstandingPairIDs[outstandingPairIDs.length - 1];
        outstandingPairIDs.pop();
    }

    function cancelPartialFills() internal {
        // ** Assume that any partialFill or totalFill resulted in yield **
        for (uint256 x = 0; x < outstandingPairIDs.length; x++) {
            order memory offer1 = getOfferInfo(outstandingPairIDs[x][0]);
            order memory offer2 = getOfferInfo(outstandingPairIDs[x][1]);

            if (
                (offer1.pay_amt == 0 &&
                    offer1.pay_gem == ERC20(0) &&
                    offer1.buy_amt == 0 &&
                    offer1.buy_gem == ERC20(0)) &&
                (offer2.pay_amt != 0 &&
                    offer2.pay_gem != ERC20(0) &&
                    offer2.buy_amt != 0 &&
                    offer2.buy_gem != ERC20(0))
            ) {
                // cancel offer2 and delete from outstandingPairsIDs as both orders are gone.
                BathToken(bathQuoteAddress).cancel(outstandingPairIDs[x][1]);
                emit LogNote("cancelled: ", outstandingPairIDs[x][1]);
                // true if quote fills -> asset yield
                logFill(outstandingPairIDs[x][0], false);
                removeElement(x);
            } else if (
                (offer1.pay_amt != 0 &&
                    offer1.pay_gem != ERC20(0) &&
                    offer1.buy_amt != 0 &&
                    offer1.pay_gem != ERC20(0)) &&
                (offer2.pay_amt == 0 &&
                    offer2.pay_gem == ERC20(0) &&
                    offer2.buy_amt == 0 &&
                    offer2.buy_gem == ERC20(0))
            ) {
                BathToken(bathAssetAddress).cancel(outstandingPairIDs[x][0]);
                emit LogNote("cancelled: ", outstandingPairIDs[x][0]);

                logFill(outstandingPairIDs[x][1], true);
                removeElement(x);
            } else if (
                (offer1.pay_amt != 0 &&
                    offer1.pay_gem != ERC20(0) &&
                    offer1.buy_amt != 0 &&
                    offer1.pay_gem != ERC20(0)) &&
                (offer2.pay_amt != 0 &&
                    offer2.pay_gem != ERC20(0) &&
                    offer2.buy_amt != 0 &&
                    offer2.buy_gem != ERC20(0))
            ) {
                // delete the offer if it is too old - this forces the expungement of static orders
                if (
                    outstandingPairIDs[x][2] <
                    (now - BathHouse(bathHouse).timeDelay())
                ) {
                    BathToken(bathAssetAddress).cancel(
                        outstandingPairIDs[x][0]
                    );
                    BathToken(bathAssetAddress).cancel(
                        outstandingPairIDs[x][1]
                    );
                    emit LogNote("cancelled both: ", outstandingPairIDs[x][0]);
                    emit LogNote("cancelled both: ", outstandingPairIDs[x][1]);
                    removeElement(x);
                } else {
                    logFill(outstandingPairIDs[x][1], false);
                    logFill(outstandingPairIDs[x][0], true);
                }
            }
        }
    }

    // Get offer info from Rubicon Market
    function getOfferInfo(uint256 id) internal view returns (order memory) {
        (uint256 ask_amt, ERC20 ask_gem, uint256 bid_amt, ERC20 bid_gem) =
            RubiconMarket(RubiconMarketAddress).getOffer(id);
        order memory offerInfo = order(ask_amt, ask_gem, bid_amt, bid_gem);
        return offerInfo;
    }

    function getOutstandingPairCount() external view returns(uint){
        return outstandingPairIDs.length;
    }

    // this throws on a zero value
    function getMaxOrderSize(address asset, address bathTokenAddress)
        public
        returns (uint256)
    {
        require(asset == underlyingAsset || asset == underlyingQuote);
        uint256 maxOrderSizeProportion = 50; //in percentage points of underlying
        uint256 underlyingBalance = IERC20(asset).balanceOf(bathTokenAddress);
        require(underlyingBalance > 0, "no bathToken liquidity to calculate max orderSize permissable");
        // emit LogNote("underlyingBalance", underlyingBalance);
        // emit LogNote(
        //     "underlying other",
        //     IERC20(underlyingQuote).balanceOf(bathQuoteAddress)
        // );
        // Divide the below by 1000
        int128 shapeCoef = ABDKMath64x64.div(-5, 1000); // 5 / 1000
        // emit LogNoteI("shapeCoef", shapeCoef);

        // if the asset/quote is overweighted: underlyingBalance / (Proportion of quote allocated to pair) * underlyingQuote balance
        if (asset == underlyingAsset) {
            // uint ratio = underlyingBalance / IERC20(underlyingQuote).balanceOf(bathQuoteAddress); //this ratio should equal price
            int128 ratio =
                ABDKMath64x64.divu(
                    underlyingBalance,
                    IERC20(underlyingQuote).balanceOf(bathQuoteAddress)
                );
            // emit LogNoteI("ratio", ratio); // this number divided by 2**64 is correct!
            if (ABDKMath64x64.mul(ratio, getMidpointPrice()) > (2**64)) {
                // bid at maxSize
                // emit LogNote(
                //     "normal maxSize Asset",
                //     (maxOrderSizeProportion * underlyingBalance) / 100
                // );
                return (maxOrderSizeProportion * underlyingBalance) / 100;
            } else {
                // return dynamic order size
                uint256 maxSize =
                    (maxOrderSizeProportion * underlyingBalance) / 100; // Correct!
                // emit LogNote("raw maxSize", maxSize);
                // int128 e = ABDKMath64x64.divu(SafeMathE.eN(), SafeMathE.eD()); //Correct as a int128!
                // emit LogNoteI("e", e);
                int128 shapeFactor =
                    ABDKMath64x64.exp(ABDKMath64x64.mul(shapeCoef, ratio));
                // emit LogNoteI("raised to the", shapeFactor);
                uint256 dynamicSize = ABDKMath64x64.mulu(shapeFactor, maxSize);
                // emit LogNote("dynamic maxSize Asset", dynamicSize); //
                return dynamicSize;
            }
        } else if (asset == underlyingQuote) {
            int128 ratio =
                ABDKMath64x64.divu(
                    underlyingBalance,
                    IERC20(underlyingAsset).balanceOf(bathAssetAddress)
                );
            if (ABDKMath64x64.div(ratio, getMidpointPrice()) > (2**64)) {
                // bid at maxSize
                // emit LogNote(
                //     "normal maxSize Quote",
                //     (maxOrderSizeProportion * underlyingBalance) / 100
                // );
                return (maxOrderSizeProportion * underlyingBalance) / 100;
            } else {
                // return dynamic order size
                uint256 maxSize =
                    (maxOrderSizeProportion * underlyingBalance) / 100; // Correct! 48000000000000000000
                // emit LogNote("raw maxSize", maxSize);
                // int128 e = ABDKMath64x64.divu(SafeMathE.eN(), SafeMathE.eD()); //Correct as a int128!
                // emit LogNoteI("e", e);
                int128 shapeFactor =
                    ABDKMath64x64.exp(ABDKMath64x64.mul(shapeCoef, ratio));
                // emit LogNoteI("raised to the", shapeFactor);
                uint256 dynamicSize = ABDKMath64x64.mulu(shapeFactor, maxSize);
                // emit LogNote("dynamic maxSize Asset", dynamicSize); // 45728245133630216043
                return dynamicSize;
            }
        }

        // PseudoCode:
        // if ratio = (assetBalance / propotional quote balance) > 1:
        //      -Use dynamic order size for quote due to underweighting: n=-0.005 => MaxSize * e^(n*ratio)
        // maxQuoteSize * (eN / eD ) ** (n *ratio)
        // else:
        //      -Use dynamic order size for asset due to underweighting: ''
        // maxAssetSize * (eN / eD ) ** (n *ratio)
        // return orderSize;
    }

    // Used to map a strategist to their orders
    function newTradeIDs(address strategist)
        internal
        returns (uint256[3] memory)
    {
        require(outstandingPairIDs[outstandingPairIDs.length - 1][2] == now);
        IDs2strategist[
            outstandingPairIDs[outstandingPairIDs.length - 1][0]
        ] = strategist;
        IDs2strategist[
            outstandingPairIDs[outstandingPairIDs.length - 1][1]
        ] = strategist;
        return outstandingPairIDs[outstandingPairIDs.length - 1];
    }

    function getLastTradeIDs() external view returns(uint[3] memory) {
        return outstandingPairIDs[outstandingPairIDs.length - 1];
    }

    function executeStrategy(
        address targetStrategy,
        uint256 askNumerator, // Quote / Asset
        uint256 askDenominator, // Asset / Quote
        uint256 bidNumerator, // size in ASSET
        uint256 bidDenominator // size in QUOTES
    ) external onlyApprovedStrategy(targetStrategy) enforceReserveRatio {
        require(
            askNumerator > 0 &&
                askDenominator > 0 &&
                bidNumerator > 0 &&
                bidDenominator > 0
        );

        // Enforce dynamic ordersizing and inventory management
        require(
            askNumerator <= getMaxOrderSize(underlyingAsset, bathAssetAddress),
            "ask too large"
        );
        require(
            bidNumerator <= getMaxOrderSize(underlyingQuote, bathQuoteAddress),
            "bid too large"
        );

        // Enforce that the bath is scrubbed for outstanding pairs
        require(
            outstandingPairIDs.length <
                BathHouse(bathHouse).maxOutstandingPairCount(),
            "too many outstanding pairs"
        );

        // 1. Enforce that a spread exists and that the ask price > best bid price && bid price < best ask price
        enforceSpread(
            askNumerator,
            askDenominator,
            bidNumerator,
            bidDenominator
        );

        // 2. Strategist executes a pair trade
        IPairsTrade(targetStrategy).execute(
            underlyingAsset,
            bathAssetAddress,
            underlyingQuote,
            bathQuoteAddress,
            askNumerator, // ask pay_amt
            askDenominator, // ask buy_amt
            bidNumerator, // bid pay_amt
            bidDenominator // bid buy_amt
        );

        // 3. Strategist trade is recorded so they can get paid and the trade is logged for time
        // Need a mapping of trade ID that filled => strategist, timestamp, their price, bid or ask, midpoint price at that time
        newTradeIDs(msg.sender);
    }

    // This function cleans outstanding orders and rebalances yield between bathTokens
    function bathScrub() public {
        // 4. Cancel Outstanding Orders
        cancelPartialFills();

        // 5. Return any filled yield to the appropriate bathToken/liquidity pool
        rebalancePair();
    }
}