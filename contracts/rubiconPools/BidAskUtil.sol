// SPDX-License-Identifier: BUSL-1.1

/// @author Benjamin Hughes - Rubicon
/// @notice This contract allows strategists to run off-chain market making strategies
/// @notice Yield from successful market making strategies are passed to LPs
/// @notice This contract is effectively the entrypoint for a strategist's pair trade

pragma solidity =0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BathToken.sol";
import "../RubiconMarket.sol";
import "./BathHouse.sol";
import "./BathPair.sol";

contract BidAskUtil {
  using SafeMath for uint256;
  bool public initialized;

  string public name;

  address public bathHouse;

  address public RubiconMarketAddress;

  event LogTrade(uint256, ERC20, uint256, ERC20);

  struct order {
    uint256 pay_amt;
    ERC20 pay_gem;
    uint256 buy_amt;
    ERC20 buy_gem;
  }

  function initialize(
    string memory _name,
    address _bathHouse,
    address _rubiconMarket
  ) external {
    require(!initialized);
    name = _name;
    bathHouse = _bathHouse;
    RubiconMarketAddress = _rubiconMarket;
    initialized = true;
  }

  modifier onlyPairs {
    require(
      BathHouse(bathHouse).isApprovedPair(msg.sender) == true,
      "not an approved pair"
    );
    _;
  }

  function placePairsTrade(
    address underlyingAsset,
    address bathAssetAddress,
    address underlyingQuote,
    address bathQuoteAddress,
    uint256 askNumerator,
    uint256 askDenomenator,
    uint256 bidNumerator,
    uint256 bidDenomenator
  ) internal {
    // 1. Calculate new bid and ask
    (order memory ask, order memory bid) = getNewOrders(
      underlyingAsset,
      underlyingQuote,
      askNumerator,
      askDenomenator,
      bidNumerator,
      bidDenomenator
    );

    // 2. place new bid and ask
    placeTrades(
      bathAssetAddress,
      bathQuoteAddress,
      ask,
      bid,
      underlyingAsset,
      underlyingQuote
    );
  }

  function getNewOrders(
    address underlyingAsset,
    address underlyingQuote,
    uint256 askNumerator,
    uint256 askDenominator,
    uint256 bidNumerator,
    uint256 bidDenominator
  ) internal pure returns (order memory, order memory) {
    ERC20 ERC20underlyingAsset = ERC20(underlyingAsset);
    ERC20 ERC20underlyingQuote = ERC20(underlyingQuote);

    order memory newAsk = order(
      askNumerator,
      ERC20underlyingAsset,
      askDenominator,
      ERC20underlyingQuote
    );
    order memory newBid = order(
      (bidNumerator),
      ERC20underlyingQuote,
      bidDenominator,
      ERC20underlyingAsset
    );
    return (newAsk, newBid);
  }

  // Calls offer (a,b,c,d, 0, false) on Rubicon Market to ensure to autofills
  function placeTrades(
    address bathAssetAddress,
    address bathQuoteAddress,
    order memory ask,
    order memory bid,
    address asset,
    address quote
  ) internal {
    address pair = BathHouse(bathHouse).getBathPair(asset, quote);

    if (
      ask.pay_amt > 0 && ask.buy_amt > 0 && bid.buy_amt > 0 && bid.pay_amt > 0
    ) {
      uint256 newAskID = BathToken(bathAssetAddress).placeOffer(
        ask.pay_amt,
        ask.pay_gem,
        ask.buy_amt,
        ask.buy_gem
      );
      emit LogTrade(ask.pay_amt, ask.pay_gem, ask.buy_amt, ask.buy_gem);

      uint256 newBidID = BathToken(bathQuoteAddress).placeOffer(
        bid.pay_amt,
        bid.pay_gem,
        bid.buy_amt,
        bid.buy_gem
      );
      emit LogTrade(bid.pay_amt, bid.pay_gem, bid.buy_amt, bid.buy_gem);
      // [askID, ask.pay_amt, bidID, bid.pay_amt, timestamp]
      BathPair(pair).addOutstandingPair([newAskID, ask.pay_amt, newBidID, bid.pay_amt, block.timestamp]);
    } else if (bid.buy_amt > 0 && bid.pay_amt > 0) {
      uint256 newBidID = BathToken(bathQuoteAddress).placeOffer(
        bid.pay_amt,
        bid.pay_gem,
        bid.buy_amt,
        bid.buy_gem
      );
      emit LogTrade(bid.pay_amt, bid.pay_gem, bid.buy_amt, bid.buy_gem);
      // [askID, ask.pay_amt, bidID, bid.pay_amt, timestamp]
      BathPair(pair).addOutstandingPair([0, 0, newBidID, bid.pay_amt, block.timestamp]);
    } else {
      uint256 newAskID = BathToken(bathAssetAddress).placeOffer(
        ask.pay_amt,
        ask.pay_gem,
        ask.buy_amt,
        ask.buy_gem
      );
      emit LogTrade(ask.pay_amt, ask.pay_gem, ask.buy_amt, ask.buy_gem);
      // [askID, ask.pay_amt, bidID, bid.pay_amt, timestamp]
      BathPair(pair).addOutstandingPair([newAskID, ask.pay_amt, 0, 0, block.timestamp]);
    }
  }

  function execute(
    address underlyingAsset,
    address bathAssetAddress,
    address underlyingQuote,
    address bathQuoteAddress,
    uint256 askNumerator,
    uint256 askDenominator,
    uint256 bidNumerator,
    uint256 bidDenominator
  ) external onlyPairs {
    // main function to chain the actions of a single strategic market making transaction (pairs trade w/ bid and ask)

    // Place pairs trade according to input
    placePairsTrade(
      underlyingAsset,
      bathAssetAddress,
      underlyingQuote,
      bathQuoteAddress,
      askNumerator,
      askDenominator,
      bidNumerator,
      bidDenominator
    );
  }
}
