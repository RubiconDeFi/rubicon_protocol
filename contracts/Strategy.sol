// contract that employs user Bath liquidity to market make and pass yield to users
pragma solidity ^0.5.16;

//Should have an interface that allows for executeStrategy...

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./BathToken.sol";
import "./RubiconMarket.sol";
import "./peripheral_contracts/SafeMath.sol";
import "./BathHouse.sol";
import "./peripheral_contracts/ABDKMath64x64.sol";

contract Strategy {
    string public name;

    address public bathHouse;
    // address public underlyingAsset;
    // address public underlyingQuote;

    // address public bathAssetAddress;
    // address public bathQuoteAddress;

    address public RubiconMarketAddress;

    mapping(address => uint256[]) addressToHoldings;

    // security mapping to ensure only Pairs
    mapping(address => bool) approvedPairs;

    uint256[] public outstandingAskIDs;
    uint256[] public outstandingBidIDs;
    uint256[2][] public outstandingPairIDs;

    event LogTrade(uint256, ERC20, uint256, ERC20);
    event LogNote(string, uint256);
    event Cancel(uint256, ERC20, uint256);

    struct order {
        uint256 pay_amt;
        ERC20 pay_gem;
        uint256 buy_amt;
        ERC20 buy_gem;
    }

    order private newAsk;
    order private newBid;

    constructor(
        string memory _name,
        address _bathHouse,
        address _rubiconMarket
    ) public {
        name = _name;
        bathHouse = _bathHouse;
        RubiconMarketAddress = _rubiconMarket;
    }

    modifier onlyPairs {
        require(
            BathHouse(bathHouse).isApprovedPair(msg.sender) == true,
            "not an approved pair"
        );
        _;
    }

    function placePairsTrade(
        // uint256 spread,
        address underlyingAsset,
        address bathAssetAddress,
        address underlyingQuote,
        address bathQuoteAddress,
        uint256 baseAsk,
        uint256 baseBid
    ) internal {
        // 2. Calculate new bid and ask
        // (order memory bestAsk, order memory bestBid) =
        getNewOrders(
            underlyingAsset,
            underlyingQuote,
            baseAsk,
            baseBid,
            bathAssetAddress,
            bathQuoteAddress
        );

        // 3. place new bid and ask
        placeTrades(bathAssetAddress, bathQuoteAddress, newAsk, newBid);
    }

    function getNewOrders(
        address underlyingAsset,
        address underlyingQuote,
        uint256 baseAsk,
        uint256 baseBid,
        address bathAssetAddress,
        address bathQuoteAddress
    ) internal returns (order memory, order memory) {
        // 2. determine Midpoint TODO: clean this...
        ERC20 ERC20underlyingAsset = ERC20(underlyingAsset);
        ERC20 ERC20underlyingQuote = ERC20(underlyingQuote);

        // TODO: implement sizing logic
        uint256 size = 1;

        if (
            RubiconMarket(RubiconMarketAddress).getOfferCount(
                ERC20underlyingAsset,
                ERC20underlyingQuote
            ) > 0
        ) {
            uint256 bestAskId =
                RubiconMarket(RubiconMarketAddress).getBestOffer(
                    ERC20underlyingAsset,
                    ERC20underlyingQuote
                );

            (
                uint256 pay_amt0,
                ERC20 pay_gem0,
                uint256 buy_amt0,
                ERC20 buy_gem0
            ) = RubiconMarket(RubiconMarketAddress).getOffer(bestAskId);

            order memory bestAsk =
                order(pay_amt0, pay_gem0, buy_amt0, buy_gem0);

            // TODO: implement dynamic bid / ask sizing by a function call here

            // order memory optimalAsk = calculateOptimalOrder(bestAsk, true);

            uint256 newAskAmt =
                bestAsk.pay_amt + ((5 * bestAsk.pay_amt) / 1e20);
            bestAsk.pay_amt = newAskAmt;

            newAsk = bestAsk;
        } else {
            order memory bestAsk =
                order(
                    (baseAsk * size),
                    ERC20underlyingAsset,
                    1e18,
                    ERC20underlyingQuote
                );
            newAsk = bestAsk;
        }

        if (
            RubiconMarket(RubiconMarketAddress).getOfferCount(
                ERC20underlyingQuote,
                ERC20underlyingAsset
            ) > 0
        ) {
            uint256 bestBidId =
                RubiconMarket(RubiconMarketAddress).getBestOffer(
                    ERC20underlyingQuote,
                    ERC20underlyingAsset
                );
            (
                uint256 pay_amt1,
                ERC20 pay_gem1,
                uint256 buy_amt1,
                ERC20 buy_gem1
            ) = RubiconMarket(RubiconMarketAddress).getOffer(bestBidId);
            order memory bestBid =
                order(pay_amt1, pay_gem1, buy_amt1, buy_gem1);

            // new amount
            uint256 newBidAmt =
                bestBid.pay_amt - ((5 * bestBid.pay_amt) / 1e20);
            bestBid.pay_amt = newBidAmt;

            newBid = bestBid;
        } else {
            order memory bestBid =
                order(
                    1e18,
                    ERC20underlyingQuote,
                    (baseBid * size),
                    ERC20underlyingAsset
                );
            newBid = bestBid;
        }
        return (newAsk, newBid);
    }

    //info represents the current best for this bid or ask
    function calculateOptimalOrder(
        order memory info,
        bool isAsk,
        address bathAssetAddress,
        address bathQuoteAddress
    ) internal {
        // orderSize is how many times that the order can divide into the quote...
        //  --> pay_amt / buy_amt = rate --> askSize or bidSize = pay_amt / rate
        //  optimal order size is given as:
        //  --> if (overWeight this asset/quote):
        //  -->     newAsk/Bid = maxOrderSize * (e**(-0.005*maxOrderSize))
        //  --> else:
        //  -->     equals maxOrderSize
        //  new amt calculation

        //  1. calculate current ratio: (asset balance / quote balance) -> target balance is current rate

        if (isAsk) {
            uint256 rate = info.pay_amt / info.buy_amt; // verify that no division errors
            // check if over balanced one way or the other... naively target balances reflective of rate...

            // uint askSize =
        } else {
            uint256 rate = info.buy_amt / info.pay_amt;
        }
    }

    function getOfferInfo(uint256 id) internal view returns (order memory) {
        (uint256 ask_amt, ERC20 ask_gem, uint256 bid_amt, ERC20 bid_gem) =
            RubiconMarket(RubiconMarketAddress).getOffer(id);
        order memory offerInfo = order(ask_amt, ask_gem, bid_amt, bid_gem);
        return offerInfo;
    }

    function placeTrades(
        address bathAssetAddress,
        address bathQuoteAddress,
        order memory ask,
        order memory bid
    ) internal returns (bool) {
        uint256 newAskID =
            BathToken(bathAssetAddress).placeOffer(
                ask.pay_amt,
                ask.pay_gem,
                ask.buy_amt,
                ask.buy_gem
            ); // TODO: SafeMath?
        emit LogTrade(ask.pay_amt, ask.pay_gem, ask.buy_amt, ask.buy_gem);
        // outstandingAskIDs.push(newAskID);

        uint256 newBidID =
            BathToken(bathQuoteAddress).placeOffer(
                bid.pay_amt,
                bid.pay_gem,
                bid.buy_amt,
                bid.buy_gem
            ); // TODO: SafeMath?
        emit LogTrade(bid.pay_amt, bid.pay_gem, bid.buy_amt, bid.buy_gem);
        // outstandingBidIDs.push(newBidID);
        outstandingPairIDs.push([newAskID, newBidID]);
    }

    function cancelPartialFills(
        address bathAssetAddress,
        address bathQuoteAddress
    ) internal {
        require(outstandingPairIDs.length < 10, "too many outstanding pairs");

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
                BathToken(bathQuoteAddress).cancel(outstandingPairIDs[x][0]);
                emit Cancel(
                    outstandingPairIDs[x][0],
                    offer1.pay_gem,
                    offer1.pay_amt
                );
                delete outstandingPairIDs[x][0];
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
                BathToken(bathAssetAddress).cancel(outstandingPairIDs[x][1]);
                emit Cancel(
                    outstandingPairIDs[x][1],
                    offer2.pay_gem,
                    offer2.pay_amt
                );
                delete outstandingPairIDs[x][1];
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
                delete outstandingPairIDs[x];
            }
        }
    }

    function rebalancePair(
        address underlyingAsset,
        address bathAssetAddress,
        address underlyingQuote,
        address bathQuoteAddress
    ) internal {
        //function to rebalance the descrepencies in bathBalance between the tokens of this pair...
        // get the balance of each pair and determine inventory levels
        uint256 bathAssetYield =
            ERC20(underlyingQuote).balanceOf(bathAssetAddress);
        uint256 bathQuoteYield =
            ERC20(underlyingAsset).balanceOf(bathQuoteAddress);

        if (bathAssetYield > 0) {
            ERC20(underlyingQuote).transferFrom(
                bathAssetAddress,
                bathQuoteAddress,
                bathAssetYield
            );
        }

        if (bathQuoteYield > 0) {
            ERC20(underlyingQuote).transferFrom(
                bathQuoteAddress,
                bathQuoteAddress,
                bathQuoteYield
            );
        }
    }

    function execute(
        address underlyingAsset,
        address bathAssetAddress,
        address underlyingQuote,
        address bathQuoteAddress
    ) external onlyPairs {
        // main function to chain the actions of a single strategic market making transaction

        // 1. Cancel Outstanding Orders
        cancelPartialFills(bathAssetAddress, bathQuoteAddress);

        // 2. Place pairs trade
        placePairsTrade(
            underlyingAsset,
            bathAssetAddress,
            underlyingQuote,
            bathQuoteAddress,
            52,
            50
            // baseAsk,
            // baseBid
        );

        // 3. Manage inventory - pass fills to the appropriate bathToken
        rebalancePair(
            underlyingAsset,
            bathAssetAddress,
            underlyingQuote,
            bathQuoteAddress
        );
    }
}
