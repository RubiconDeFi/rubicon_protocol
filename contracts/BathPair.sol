pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./BathToken.sol";
import "./RubiconMarket.sol";
import "./peripheral_contracts/SafeMath.sol";

contract BathPair {
    address public bathHouse;
    address public underlyingAsset;
    address public underlyingQuote;

    address public bathAssetAddress;
    address public bathQuoteAddress;

    address public RubiconMarketAddress;

    mapping(address => uint256[]) addressToHoldings;

    uint256[] public outstandingAskIDs;
    uint256[] public outstandingBidIDs;
    uint256[2][] public outstandingPairIDs;

    event LogTrade(uint256, ERC20, uint256, ERC20);
    event LogNote(string, uint256);
    event Cancel(uint, ERC20, uint);

    constructor() public {
        bathHouse = msg.sender;
    }

    // TODO: add onlyKeeper modifier while using permissioned keepers

    // initialize() -start the token
    function initialize(
        address asset,
        string calldata assetName,
        address quote,
        string calldata quoteName,
        address market
    ) external {
        require(msg.sender == bathHouse, "caller must be Bath House");
        underlyingAsset = asset;
        underlyingQuote = quote;

        //deploy new BathTokens:
        BathToken bathAsset =
            new BathToken(
                string(abi.encodePacked("bath", (assetName))),
                asset,
                market
            );
        bathAssetAddress = address(bathAsset);

        BathToken bathQuote =
            new BathToken(
                string(abi.encodePacked("bath", (quoteName))),
                quote,
                market
            );
        bathQuoteAddress = address(bathQuote);

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

        // (bool success0, bytes memory data0) = (asset).delegatecall(abi.encodeWithSignature("approve(address,uint)", bathAssetAddress, assetAmount));
        // (bool success1, bytes memory data1) = (quote).delegatecall(abi.encodeWithSignature("approve(address,uint)", bathQuoteAddress, quoteAmount));

        // _mint(msg.sender, amount);
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

    function placePairsTrade(uint256 spread) external {
        require(spread < 100);
        require(spread > 0);

        // 1. Cancel Outstanding Orders
        //to do: make this good
        require(outstandingPairIDs.length < 10, "too many outstanding pairs");
        {
            for (uint256 x = 0; x < outstandingPairIDs.length; x++) {
                (
                    uint256 ask_amt0,
                    ERC20 ask_gem0,
                    uint256 bid_amt0,
                    ERC20 bid_gem0
                ) =
                    RubiconMarket(RubiconMarketAddress).getOffer(
                        outstandingPairIDs[x][0]
                    );
                (
                    uint256 ask_amt1,
                    ERC20 ask_gem1,
                    uint256 bid_amt1,
                    ERC20 bid_gem1
                ) =
                    RubiconMarket(RubiconMarketAddress).getOffer(
                        outstandingPairIDs[x][1]
                    );
                if ((ask_amt0 == 0 && ask_gem0 == ERC20(0) && bid_amt0 == 0 && bid_gem0 == ERC20(0))
                    &&
                    (ask_amt1 != 0 && ask_gem1 != ERC20(0) && bid_amt1 != 0 && bid_gem1 != ERC20(0))
                ){
                    BathToken(bathQuoteAddress).cancel(outstandingPairIDs[x][0]);
                    emit Cancel(outstandingPairIDs[x][0], ask_gem0, ask_amt0);
                    delete outstandingPairIDs[x][0];
                }
                else if ((ask_amt0 != 0 && ask_gem0 != ERC20(0) && bid_amt0 != 0 && bid_gem0 != ERC20(0))
                    &&
                    (ask_amt1 == 0 && ask_gem1 == ERC20(0) && bid_amt1 == 0 && bid_gem1 == ERC20(0))) {
                    BathToken(bathAssetAddress).cancel(outstandingPairIDs[x][1]);
                    emit Cancel(outstandingPairIDs[x][1], ask_gem1, ask_amt1);
                    delete outstandingPairIDs[x][1];
                    }
                else if ((ask_amt0 != 0 && ask_gem0 != ERC20(0) && bid_amt0 != 0 && bid_gem0 != ERC20(0))
                    &&
                    (ask_amt1 != 0 && ask_gem1 != ERC20(0) && bid_amt1 != 0 && bid_gem1 != ERC20(0))) {
                        delete outstandingPairIDs[x];
                    }
                // emit LogTrade(ask_amt, ask_gem, bid_amt, bid_gem);
                //cancel order if pair is filled - naive check on this is submit as a pair...
            }
        }

        // 2. determine Midpoint
        //add sanity check ?

        uint256 bestAskID =
            RubiconMarket(RubiconMarketAddress).getBestOffer(
                ERC20(underlyingAsset),
                ERC20(underlyingQuote)
            );
        emit LogNote("bestAskId", bestAskID);
        (uint256 pay_amt0, ERC20 pay_gem0, uint256 buy_amt0, ERC20 buy_gem0) =
            RubiconMarket(RubiconMarketAddress).getOffer(bestAskID);

        // If no orders in the orderbook then throw
        if (
            pay_gem0 == ERC20(0) &&
            pay_amt0 == 0 &&
            buy_gem0 == ERC20(0) &&
            buy_amt0 == 0
        ) {
            emit LogTrade(pay_amt0, pay_gem0, buy_amt0, buy_gem0);
            return;
        }
        require(
            pay_gem0 != ERC20(0) &&
                pay_amt0 != 0 &&
                buy_gem0 != ERC20(0) &&
                buy_amt0 != 0,
            "empty order ask"
        );

        // 3. Place trades at a fixed spread of the midpoint
        uint256 newAskAmt = pay_amt0 + ((spread * pay_amt0) / 1e20);
        uint256 newAskID =
            BathToken(bathAssetAddress).placeOffer(
                newAskAmt,
                pay_gem0,
                buy_amt0,
                buy_gem0
            ); // TODO: SafeMath?
        emit LogTrade(newAskAmt, pay_gem0, buy_amt0, buy_gem0);
        // outstandingAskIDs.push(newAskID);

        uint256 bestBidID =
            RubiconMarket(RubiconMarketAddress).getBestOffer(
                ERC20(underlyingQuote),
                ERC20(underlyingAsset)
            );
        emit LogNote("bestBidId", bestAskID);

        (uint256 pay_amt1, ERC20 pay_gem1, uint256 buy_amt1, ERC20 buy_gem1) =
            RubiconMarket(RubiconMarketAddress).getOffer(bestBidID);

        require(
            pay_gem1 != ERC20(0) &&
                pay_amt1 != 0 &&
                buy_gem1 != ERC20(0) &&
                buy_amt1 != 0,
            "empty order bid"
        );

        uint256 newBidAmt = pay_amt1 - ((spread * pay_amt1) / 1e20);
        uint256 newBidID =
            BathToken(bathQuoteAddress).placeOffer(
                newBidAmt,
                pay_gem1,
                buy_amt1,
                buy_gem1
            ); // TODO: SafeMath?
        emit LogTrade(newBidAmt, buy_gem1, pay_amt1, pay_gem1);
        // outstandingBidIDs.push(newBidID);
        outstandingPairIDs.push([newAskID, newBidID]);
    }

    function rebalancePair() external {
        //function to rebalance the descrepencies in bathBalance between the tokens of this pair...
        // get the balance of each pair and determine inventory levels
    }
}
