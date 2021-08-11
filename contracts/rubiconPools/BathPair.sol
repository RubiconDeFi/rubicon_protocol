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
  uint256[5][] public outstandingPairIDs;

  event LogNote(string, uint256, uint256);
  event LogStrategistTrades(
    uint256 idAsk,
    address askAsset,
    uint256 askAmt,
    uint256 idBid,
    address bidAsset,
    uint256 bidAmt,
    address strategist,
    uint256 timestamp
  );
  event StrategistRewardClaim(
    address strategist,
    address asset,
    uint256 amountOfReward,
    uint256 timestamp
  );

  /// @dev Maps a trade ID to each of their strategists for rewards purposes
  mapping(uint256 => address) public IDs2strategist;
  mapping(address => uint256) public strategist2FillsAsset;
  mapping(address => uint256) public strategist2FillsQuote;

  struct order {
    uint256 pay_amt;
    ERC20 pay_gem;
    uint256 buy_amt;
    ERC20 buy_gem;
  }

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
    searchRadius = 3;
    initialized = true;
  }

  modifier onlyBathHouse {
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

  modifier enforceReserveRatio {
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
    require(
      bestAskID > 0 && bestBidID > 0,
      "bids or asks are missing to get a Midpoint"
    );

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

  // Takes the proposed bid and ask as a parameter - that the offers placed won't match and are maker orders
  // bid price > best ask
  function enforceSpread(
    uint256 askN,
    uint256 askD,
    uint256 bidN,
    uint256 bidD
  ) internal view {
    require(
      (askN > 0 && askD > 0) || (bidN > 0 && bidD > 0),
      "one order must be non-zero"
    );
    address _RubiconMarketAddress = RubiconMarketAddress;
    uint256 bestAskID = RubiconMarket(_RubiconMarketAddress).getBestOffer(
      ERC20(underlyingAsset),
      ERC20(underlyingQuote)
    );
    uint256 bestBidID = RubiconMarket(_RubiconMarketAddress).getBestOffer(
      ERC20(underlyingQuote),
      ERC20(underlyingAsset)
    );

    order memory bestAsk = getOfferInfo(bestAskID);
    order memory bestBid = getOfferInfo(bestBidID);

    // If orders in the order book, adhere to more constraints
    if (
      bestAsk.pay_amt > 0 &&
      bestAsk.buy_amt > 0 &&
      bestBid.pay_amt > 0 &&
      bestBid.buy_amt > 0
    ) {
      if (askN > 0 && askD > 0 && bidN > 0 && bidD > 0) {
        require(
          ((bestAsk.buy_amt.mul(bidD)) > (bestAsk.pay_amt.mul(bidN))) &&
            ((askD.mul(bestBid.buy_amt)) > (bestBid.pay_amt.mul(askN))),
          "bid must be < bestAsk && ask must be > best Bid in Price"
        );
      } else if (bidN > 0 && bidD > 0) {
        // Goal is for (bestAsk.buy_amt / bestAsk.pay_amt) > (bidNumerator / bidDenominator)
        require(
          (bestAsk.buy_amt.mul(bidD)) > (bestAsk.pay_amt.mul(bidN)),
          "bid price is not less than the best ask"
        );
      } else if (askN > 0 && askD > 0) {
        // Goal is for (askDenominator / askNumerator) > (bestBid.pay_amt / bestBid.buy_amt)
        require(
          (askD.mul(bestBid.buy_amt)) > (bestBid.pay_amt.mul(askN)),
          "ask price not greater than best bid"
        );
      }
    }
    // check that ask price > bid price if two offers given
    if (askN > 0 && askD > 0 && bidN > 0 && bidD > 0) {
      require((askD.mul(bidD)) > (bidN.mul(askN)));
    }
  }

  function getThisBathQuote() external view returns (address) {
    require(initialized);
    return bathQuoteAddress;
  }

  function getThisBathAsset() external view returns (address) {
    require(initialized);
    return bathAssetAddress;
  }

  // Returns filled liquidity to the correct bath pool
  function rebalancePair() internal {
    uint256 bathAssetYield = ERC20(underlyingQuote).balanceOf(bathAssetAddress);
    uint256 bathQuoteYield = ERC20(underlyingAsset).balanceOf(bathQuoteAddress);
    uint16 stratReward = BathHouse(bathHouse).getBPSToStrats(address(this));
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
    }
  }

  function addOutstandingPair(uint256[5] memory IDPair)
    internal
  {
    require(IDPair.length == 5);
    outstandingPairIDs.push(IDPair);
  }

  // orderID of the fill
  // only log fills for each strategist - needs to be asset specific
  // isAssetFill are *quotes* that result in asset yield
  function logFill(
    uint256 amt,
    uint256 orderID,
    bool isAssetFill
  ) internal {
    // Goal is to map a fill to a strategist
    if (isAssetFill) {
      strategist2FillsAsset[IDs2strategist[orderID]] += amt;
      totalAssetFills += amt;
    } else {
      strategist2FillsQuote[IDs2strategist[orderID]] += amt;
      totalQuoteFills += amt;
    }
  }

  function removeElement(uint256 index) internal {
    outstandingPairIDs[index] = outstandingPairIDs[
      outstandingPairIDs.length - 1
    ];
    outstandingPairIDs.pop();
  }

  function cancelPartialFills() internal {
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
      if (outstandingPairIDs[x][4] < (block.timestamp - timeDelay)) {
        uint256 askId = outstandingPairIDs[x][0];
        uint256 askAmt = outstandingPairIDs[x][1];
        uint256 bidId = outstandingPairIDs[x][2];
        uint256 bidAmt = outstandingPairIDs[x][3];
        order memory offer1 = getOfferInfo(askId); //ask
        order memory offer2 = getOfferInfo(bidId); //bid
        uint256 askDelta = askAmt - offer1.pay_amt;
        uint256 bidDelta = bidAmt - offer2.pay_amt;

        // if real
        if (askId != 0) {
          // if delta > 0 - delta is fill => handle any amount of fill here
          if (askDelta > 0) {
            logFill(askDelta, askId, true); //todo make this accept an amount
            BathToken(bathAssetAddress).removeFilledTradeAmount(askDelta);
            // not a full fill
            if (askDelta != askAmt) {
              BathToken(bathAssetAddress).cancel(askId, askAmt.sub(askDelta));
            }
          }
          // otherwise didn't fill so cancel
          else {
            BathToken(bathAssetAddress).cancel(askId, askAmt); // pas amount too
          }
        }

        // if real
        if (bidId != 0) {
          // if delta > 0 - delta is fill => handle any amount of fill here
          if (bidDelta > 0) {
            logFill(bidDelta, bidId, false); //todo make this accept an amount
            BathToken(bathQuoteAddress).removeFilledTradeAmount(bidDelta);
            // not a full fill
            if (bidDelta != bidAmt) {
              BathToken(bathQuoteAddress).cancel(bidId, bidAmt.sub(bidDelta));
            }
          }
          // otherwise didn't fill so cancel
          else {
            BathToken(bathQuoteAddress).cancel(bidId, bidAmt); // pas amount too
          }
        }

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

  function getOutstandingPairCount() external view returns (uint256) {
    return outstandingPairIDs.length;
  }

  function getSearchRadius() external view returns (uint256) {
    return searchRadius;
  }

  // this throws on a zero value ofliquidity
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

    // if the asset/quote is overweighted: underlyingBalance / (Proportion of quote allocated to pair) * underlyingQuote balance
    if (asset == _underlyingAsset) {
      int128 ratio = ABDKMath64x64.divu(
        underlyingBalance,
        IERC20(_underlyingQuote).balanceOf(bathQuoteAddress)
      );
      if (ABDKMath64x64.mul(ratio, getMidpointPrice()) > (2**64)) {
        // bid at maxSize
        return maxOrderSizeBPS.mul(underlyingBalance).div(10000);
      } else {
        // return dynamic order size
        uint256 maxSize = maxOrderSizeBPS.mul(underlyingBalance).div(10000);
        int128 shapeFactor = ABDKMath64x64.exp(
          ABDKMath64x64.mul(
            shapeCoef,
            ABDKMath64x64.inv(ABDKMath64x64.mul(ratio, getMidpointPrice()))
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
      if (ABDKMath64x64.div(ratio, getMidpointPrice()) > (2**64)) {
        return maxOrderSizeBPS.mul(underlyingBalance).div(10000);
      } else {
        // return dynamic order size
        uint256 maxSize = maxOrderSizeBPS.mul(underlyingBalance).div(10000);
        int128 shapeFactor = ABDKMath64x64.exp(
          ABDKMath64x64.mul(
            shapeCoef,
            ABDKMath64x64.inv(ABDKMath64x64.div(ratio, getMidpointPrice()))
          )
        );
        uint256 dynamicSize = ABDKMath64x64.mulu(shapeFactor, maxSize);
        return dynamicSize;
      }
    }
  }

  // Used to map a strategist to their orders
  function newTradeIDs(address strategist) internal {
    require(
      outstandingPairIDs[outstandingPairIDs.length - 1][4] == block.timestamp
    );
    IDs2strategist[
      outstandingPairIDs[outstandingPairIDs.length - 1][0]
    ] = strategist;
    IDs2strategist[
      outstandingPairIDs[outstandingPairIDs.length - 1][2]
    ] = strategist;
  }

  function getLastTradeIDs() external view returns (uint256[5] memory) {
    return outstandingPairIDs[outstandingPairIDs.length - 1];
  }

  // ** Below are the functions that can be called by Strategists **

  function executeStrategy(
    uint256 askNumerator, // Quote / Asset
    uint256 askDenominator, // Asset / Quote
    uint256 bidNumerator, // size in ASSET
    uint256 bidDenominator // size in QUOTES
  )
    external
    enforceReserveRatio
    onlyApprovedStrategist(msg.sender)
  {
    // Require at least one order is non-zero
    require(
      (askNumerator > 0 && askDenominator > 0) ||
        (bidNumerator > 0 && bidDenominator > 0)
    );
    address _underlyingAsset = underlyingAsset;
    address _underlyingQuote = underlyingQuote;
    address _bathAssetAddress = bathAssetAddress;
    address _bathQuoteAddress = bathQuoteAddress;

    // Enforce dynamic ordersizing and inventory management
    require(
      askNumerator <= getMaxOrderSize(_underlyingAsset, _bathAssetAddress),
      "ask too large"
    );
    require(
      bidNumerator <= getMaxOrderSize(_underlyingQuote, _bathQuoteAddress),
      "bid too large"
    );

    // Enforce that the bath is scrubbed for outstanding pairs
    require(
      outstandingPairIDs.length <
        BathHouse(bathHouse).maxOutstandingPairCount(),
      "too many outstanding pairs, please call bathScrub() first"
    );

    // 1. Enforce that a spread exists and that the ask price > best bid price && bid price < best ask price
    enforceSpread(askNumerator, askDenominator, bidNumerator, bidDenominator);

    // Trying:
    // 1. Calculate new bid and ask
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

    // 2. place new bid and ask
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
    addOutstandingPair(
      [newAskID, ask.pay_amt, newBidID, bid.pay_amt, block.timestamp]
    );

    // 3. Strategist trade is recorded so they can get paid and the trade is logged for time
    // Need a mapping of trade ID that filled => strategist, timestamp, their price, bid or ask, midpoint price at that time
    newTradeIDs(msg.sender);
  }

  // This function cleans outstanding orders and rebalances yield between bathTokens
  function bathScrub() external {
    // 4. Cancel Outstanding Orders that need to be cleared or logged for yield
    cancelPartialFills();

    // 5. Return any filled yield to the appropriate bathToken/liquidity pool
    rebalancePair();
  }

  // This function allows a strategist to remove Pools liquidity from the order book
  function removeLiquidity(uint256 id) external {
    require(
      IDs2strategist[id] == msg.sender,
      "only strategist can cancel their orders"
    );
    order memory ord = getOfferInfo(id);
    if (ord.pay_gem == ERC20(underlyingAsset)) {
      uint256 len = outstandingPairIDs.length;
      for (uint256 x = 0; x < len; x++) {
        if (outstandingPairIDs[x][0] == id) {
          BathToken(bathAssetAddress).cancel(id, outstandingPairIDs[x][1]);
          removeElement(x);
          break;
        }
      }
    } else if (ord.pay_gem == ERC20(underlyingQuote)) {
      uint256 len = outstandingPairIDs.length;
      for (uint256 x = 0; x < len; x++) {
        if (outstandingPairIDs[x][2] == id) {
          BathToken(bathAssetAddress).cancel(id, outstandingPairIDs[x][3]);
          removeElement(x);
          break;
        }
      }
    }
  }
}
