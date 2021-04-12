pragma solidity ^0.5.16;

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

    uint256[] public outstandingAskIDs;
    uint256[] public outstandingBidIDs;
    uint256[2][] public outstandingPairIDs;

    // Risk Parameters
    uint256 public reserveRatio; // proportion of the pool that must remain present in the pair
    uint256 public maximumOrderSize; // max order size that can be places in a single order

    event LogTrade(uint256, ERC20, uint256, ERC20);
    event LogNote(string, uint256);
    event Cancel(uint256, ERC20, uint256);

    bool public initialized;

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

    modifier onlyApprovedStrategy(address targetStrategy) {
        require(
            BathHouse(bathHouse).isApprovedStrat(targetStrategy) == true,
            "not an approved sender"
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
            bathHouse,
            quote
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
                bathHouse,
                asset
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
        IERC20(asset).transferFrom(msg.sender, bathAssetAddress, assetAmount);
        IERC20(quote).transferFrom(msg.sender, bathQuoteAddress, quoteAmount);

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
            BathToken(bathAssetAddress).rebalance(bathQuoteAddress);
        }

        if (bathQuoteYield > 0) {
            BathToken(bathQuoteAddress).rebalance(bathAssetAddress);
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

        function cancelPartialFills(
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
                BathToken(bathQuoteAddress).cancel(outstandingPairIDs[x][1]);
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
                BathToken(bathAssetAddress).cancel(outstandingPairIDs[x][0]);
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

        function getOfferInfo(uint256 id) internal view returns (order memory) {
        (uint256 ask_amt, ERC20 ask_gem, uint256 bid_amt, ERC20 bid_gem) =
            RubiconMarket(RubiconMarketAddress).getOffer(id);
        order memory offerInfo = order(ask_amt, ask_gem, bid_amt, bid_gem);
        return offerInfo;
    }

    function executeStrategy(
        address targetStrategy,
        uint256 askNumerator, // Quote / Asset
        uint256 askDenominator, // Asset / Quote
        uint256 bidNumerator, // size in ASSET
        uint256 bidDenominator // size in QUOTES
    ) external onlyApprovedStrategy(targetStrategy) enforceReserveRatio {
        // TODO: enforce order size as a proportion of inventory
        // TODO: enforce a spread must exist
        // TODO: enforce a bid must be less than best Ask (+ some spread) and an ask must be greater than best bid (+some spread)
        
        // 1. Cancel Outstanding Orders
        cancelPartialFills();
        
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
        // TODO: Add logic to pay strategists
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
                now
            )
        );
        
        // Return any filled yield to the appropriate bathToken
        rebalancePair();
    }
}
