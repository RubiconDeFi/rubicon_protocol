pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./BathToken.sol";
import "./BathHouse.sol";
import "../RubiconMarket.sol";
import "../peripheral_contracts/SafeMath.sol";
import "../interfaces/IStrategy.sol";

contract BathPair {
    address public bathHouse;
    address public underlyingAsset;
    address public underlyingQuote;

    address public bathAssetAddress;
    address public bathQuoteAddress;

    address public RubiconMarketAddress;

    // askID, bidID, timestamp
    uint256[3][] public outstandingPairIDs;

    // Risk Parameters
    uint256 public reserveRatio; // proportion of the pool that must remain present in the pair
    uint256 public maximumOrderSize; // max order size that can be places in a single order

    event LogTrade(uint256, ERC20, uint256, ERC20);
    event LogNote(string, uint256);
    event Cancel(uint256, ERC20, uint256);
    event LogOffer(string, order);
    event LogGrossYield(address, uint256);

    bool public initialized;

    // TODO: make this a variable with setter
    uint256 public timeDelay = 3 days;

    // Maps a trade ID to each of their strategists
    mapping(uint256 => address) public ID2strategist;
    mapping(address => uint256) public strategist2Fills;
    StrategistTrade[] public strategistRecord;

    struct StrategistTrade {
        address underlyingAsset;
        address bathAssetAddress;
        address underlyingQuote;
        address bathQuoteAddress;
        uint256 askNumerator;
        uint256 askDenominator;
        uint256 bidNumerator;
        uint256 bidDenominator;
        address strategist;
        uint256 timestamp;
        uint256[3] tradeIDs;
    }

    struct order {
        uint256 pay_amt;
        ERC20 pay_gem;
        uint256 buy_amt;
        ERC20 buy_gem;
    }

    function initialize() public {
        require(!initialized);
        bathHouse = msg.sender;
        initialized = true;
    }

    modifier onlyBathHouse {
        require(msg.sender == bathHouse);
        _;
    }

    modifier enforceReserveRatio {
        require(
            (BathToken(bathAssetAddress).totalSupply() * reserveRatio) / 100 <=
                IERC20(underlyingAsset).balanceOf(bathAssetAddress)
        );
        require(
            (BathToken(bathQuoteAddress).totalSupply() * reserveRatio) / 100 <=
                IERC20(underlyingQuote).balanceOf(bathQuoteAddress)
        );
        _;
        require(
            (BathToken(bathAssetAddress).totalSupply() * reserveRatio) / 100 <=
                IERC20(underlyingAsset).balanceOf(bathAssetAddress)
        );
        require(
            (BathToken(bathQuoteAddress).totalSupply() * reserveRatio) / 100 <=
                IERC20(underlyingQuote).balanceOf(bathQuoteAddress)
        );
    }

    function getMidpointPrice() internal returns (uint256) {
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
        uint256 midpoint =
            ((bestAsk.buy_amt / bestAsk.pay_amt) +
                (bestBid.pay_amt / bestBid.buy_amt)) / 2;
        emit LogNote("midpoint calculated:", midpoint);
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

    modifier onlyApprovedStrategy(address targetStrategy) {
        require(
            BathHouse(bathHouse).isApprovedStrat(targetStrategy) == true,
            "not an approved strategy - bathPair"
        );
        _;
    }

    // initialize() -start the token
    function initializePair(
        address asset,
        string calldata assetName,
        address quote,
        string calldata quoteName,
        address market,
        uint256 _reserveRatio
    ) external {
        require(msg.sender == bathHouse, "caller must be Bath House");
        require(_reserveRatio <= 100);
        require(_reserveRatio > 0);
        reserveRatio = _reserveRatio;

        underlyingAsset = asset;
        underlyingQuote = quote;

        //deploy new BathTokens:
        BathToken bathAsset = new BathToken();
        bathAsset.initialize(
            string(abi.encodePacked("bath", (assetName))),
            asset,
            market,
            bathHouse
        );
        bathAssetAddress = address(bathAsset);

        if (BathHouse(bathHouse).doesQuoteExist(quote)) {
            // don't deploy the new
            address bathQuote =
                BathHouse(bathHouse).quoteToBathQuoteCheck(quote);
            bathQuoteAddress = address(bathQuote);
        } else {
            // deploy a new bathQuote
            BathToken bathQuote = new BathToken();
            bathQuote.initialize(
                string(abi.encodePacked("bath", (quoteName))),
                quote,
                market,
                bathHouse
            );
            bathQuoteAddress = address(bathQuote);
        }

        RubiconMarketAddress = market;
    }

    function deposit(
        address asset,
        uint256 assetAmount,
        address quote,
        uint256 quoteAmount
    ) external returns (uint256 bathAssetAmount, uint256 bathQuoteAmount) {
        // require(bathTokens exist)
        require(asset != quote);
        require(asset == underlyingAsset, "wrong asset nerd");
        require(quote == underlyingQuote, "wrong quote nerd");

        // mint the bathTokens to the user in accordance to weights, send underlying assets to each Bath Token
        IERC20(asset).transferFrom(msg.sender, address(this), assetAmount);
        IERC20(quote).transferFrom(msg.sender, address(this), quoteAmount);

        IERC20(asset).approve(bathAssetAddress, assetAmount);
        IERC20(quote).approve(bathQuoteAddress, quoteAmount);

        IBathToken(bathAssetAddress).mint(msg.sender, assetAmount);
        IBathToken(bathQuoteAddress).mint(msg.sender, quoteAmount);

        //filler for return values
        return (assetAmount, quoteAmount);
    }

    function withdraw(
        address asset,
        uint256 assetAmount,
        address quote,
        uint256 quoteAmount
    ) external {
        require(asset != quote);
        require(asset == underlyingAsset, "wrong asset nerd");
        require(quote == underlyingQuote, "wrong quote nerd");

        require(
            IERC20(asset).balanceOf(bathAssetAddress) >= assetAmount,
            "Not enough underlying in bathToken"
        );
        require(
            IERC20(quote).balanceOf(bathQuoteAddress) >= quoteAmount,
            "Not enough underlying in bathToken"
        );

        //Return funds to users
        IBathToken(bathAssetAddress).withdraw(msg.sender, assetAmount);
        IBathToken(bathQuoteAddress).withdraw(msg.sender, quoteAmount);
    }

    function rebalancePair() internal {
        uint256 bathAssetYield =
            ERC20(underlyingQuote).balanceOf(bathAssetAddress);
        uint256 bathQuoteYield =
            ERC20(underlyingAsset).balanceOf(bathQuoteAddress);

        if (bathAssetYield > 0) {
            BathToken(bathAssetAddress).rebalance(
                bathQuoteAddress,
                underlyingQuote
            );
            emit LogGrossYield(bathQuoteAddress, bathAssetYield);
        }

        if (bathQuoteYield > 0) {
            BathToken(bathQuoteAddress).rebalance(
                bathAssetAddress,
                underlyingAsset
            );
            emit LogGrossYield(bathAssetAddress, bathQuoteYield);
        }

        // Return settled trades to the appropriate bathToken
        require(
            IERC20(underlyingAsset).balanceOf(bathQuoteAddress) == 0,
            "yield not correctly rebalanced"
        );
        require(
            IERC20(underlyingQuote).balanceOf(bathAssetAddress) == 0,
            "yield not correctly rebalanced"
        );
    }

    function addOutstandingPair(uint256[3] calldata IDPair) external {
        require(
            BathHouse(bathHouse).isApprovedStrat(msg.sender) == true,
            "not an approved strategy"
        );
        require(IDPair.length == 3);
        outstandingPairIDs.push(IDPair);
    }

    // orderID of the fill
    function logFill(uint orderID) internal {
        // Goal is to map a fill to a strategist
        address strategist = ID2strategist[orderID];
        strategist2Fills[strategist] += 1;
    }

    function cancelPartialFills() internal {
        // TODO: make this constraint variable
        // ** Optimistically assume that any partialFill or totalFill resulted in yield?
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
                // cancel offer2 and delete from outstandingPairsIDs as both orders are gone.
                BathToken(bathQuoteAddress).cancel(outstandingPairIDs[x][1]);
                emit Cancel(
                    outstandingPairIDs[x][1],
                    offer1.pay_gem,
                    offer1.pay_amt
                );
                delete outstandingPairIDs[x];
                // emit LogNote("Yield:", null);
                // logYield(
                //     outstandingPairIDs[x][0],
                //     outstandingPairIDs[x][0],
                //     bathAssetAddress
                // );
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
                emit Cancel(
                    outstandingPairIDs[x][0],
                    offer2.pay_gem,
                    offer2.pay_amt
                );
                delete outstandingPairIDs[x];
                // logYield(
                //     outstandingPairIDs[x][1],
                //     outstandingPairIDs[x][0],
                //     bathQuoteAddress
                // );
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
                // delete the offer if it is too old
                if (outstandingPairIDs[x][2] < (now - timeDelay)) {
                    BathToken(bathAssetAddress).cancel(
                        outstandingPairIDs[x][0]
                    );
                    emit Cancel(
                        outstandingPairIDs[x][0],
                        offer2.pay_gem,
                        offer2.pay_amt
                    );
                    BathToken(bathAssetAddress).cancel(
                        outstandingPairIDs[x][1]
                    );
                    emit Cancel(
                        outstandingPairIDs[x][1],
                        offer2.pay_gem,
                        offer2.pay_amt
                    );
                    delete outstandingPairIDs[x];
                } else {
                    // logYield(
                    //     outstandingPairIDs[x][1],
                    //     outstandingPairIDs[x][1],
                    //     bathQuoteAddress
                    // );
                    // logYield(
                    //     outstandingPairIDs[x][0],
                    //     outstandingPairIDs[x][1],
                    //     bathQuoteAddress
                    // );
                }
            }
        }
    }

    function getOfferInfo(uint256 id) internal view returns (order memory) {
        (uint256 ask_amt, ERC20 ask_gem, uint256 bid_amt, ERC20 bid_gem) =
            RubiconMarket(RubiconMarketAddress).getOffer(id);
        order memory offerInfo = order(ask_amt, ask_gem, bid_amt, bid_gem);
        return offerInfo;
    }

    // TODO: make sure this works as intended
    // Used to map a strategist to their orders
    function newTradeIDs() internal returns (uint256[3] memory) {
        require(outstandingPairIDs[outstandingPairIDs.length - 1][2] == now);
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
        // TODO: enforce order size as a proportion of inventory -- inventory management
        // 1. Enforce that a spread exists and that the ask price > best bid price && bid price < best ask price
        enforceSpread(
            askNumerator,
            askDenominator,
            bidNumerator,
            bidDenominator
        );

        // 2. Strategist executes a pair trade
        IStrategy(targetStrategy).execute(
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
        strategistRecord.push(
            StrategistTrade(
                underlyingAsset,
                bathAssetAddress,
                underlyingQuote,
                bathQuoteAddress,
                askNumerator,
                askDenominator,
                bidNumerator,
                bidDenominator,
                msg.sender,
                now,
                newTradeIDs()
            )
        );

        // 4. Cancel Outstanding Orders
        cancelPartialFills();

        // 5. Return any filled yield to the appropriate bathToken/liquidity pool
        rebalancePair();
    }
}
