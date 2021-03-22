// contract that employs user Bath liquidity to market make and pass yield to users
pragma solidity ^0.5.16;

//Should have an interface that allows for executeStrategy...

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./BathToken.sol";
import "./RubiconMarket.sol";
import "./peripheral_contracts/SafeMath.sol";
import "./BathHouse.sol";

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
    event Cancel(uint, ERC20, uint);

    struct order {
                    uint256 pay_amt;
                    ERC20 pay_gem;
                    uint256 buy_amt;
                    ERC20 buy_gem;
    }

    constructor(string memory _name, address _bathHouse) public {
        name = _name;
        bathHouse = _bathHouse;
    }

    modifier onlyPairs {
        require(BathHouse(bathHouse).isApprovedPair(msg.sender) == true, "not an approved pair");
        _;
    }

   function placePairsTrade(uint256 spread, address underlyingAsset, address bathAssetAddress, address underlyingQuote, address bathQuoteAddress) internal {
        require(spread < 100);
        require(spread > 0);
        // uint spread = _spread;
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


        // 3. Place trades at a fixed spread of the midpoint
        (order memory bestAsk, order memory bestBid) = getNewOrders(underlyingAsset, underlyingQuote);

        placeTrades(bathAssetAddress, bathQuoteAddress, bestAsk, bestBid);
        
    }

    function getNewOrders(address underlyingAsset, address underlyingQuote) internal returns (order memory,  order memory) {
         // 2. determine Midpoint TODO: extrapolate
        //add sanity check ?
        ERC20 ERC20underlyingAsset = ERC20(underlyingAsset);
        ERC20 ERC20underlyingQuote = ERC20(underlyingQuote);

        (uint256 pay_amt0, ERC20 pay_gem0, uint256 buy_amt0, ERC20 buy_gem0) =
            RubiconMarket(RubiconMarketAddress).getOffer(RubiconMarket(RubiconMarketAddress).getBestOffer(
                ERC20underlyingAsset,
                ERC20underlyingQuote
            ));
        
        order memory bestAsk = order( pay_amt0,  pay_gem0,  buy_amt0,  buy_gem0);

        require(
            bestAsk.pay_gem != ERC20(0) &&
                bestAsk.pay_amt != 0 &&
                bestAsk.buy_gem != ERC20(0) &&
                bestAsk.buy_amt != 0,
            "empty order ask"
        );

        (uint256 pay_amt1, ERC20 pay_gem1, uint256 buy_amt1, ERC20 buy_gem1) =
            RubiconMarket(RubiconMarketAddress).getOffer( RubiconMarket(RubiconMarketAddress).getBestOffer(
                ERC20underlyingQuote,
                ERC20underlyingAsset
            ));
        order memory bestBid  = order( pay_amt1,  pay_gem1,  buy_amt1,  buy_gem1);

       require(
            bestBid.pay_gem != ERC20(0) &&
                bestBid.pay_amt != 0 &&
                bestBid.buy_gem != ERC20(0) &&
                bestBid.buy_amt != 0,
            "empty order bid"
        );

        uint256 newBidAmt = bestBid.pay_amt - ((5 * bestBid.pay_amt) / 1e20);
        uint256 newAskAmt = bestAsk.pay_amt + ((5 * bestAsk.pay_amt) / 1e20);

        bestAsk.pay_amt = newAskAmt;
        bestBid.pay_amt = newBidAmt;
        return (bestAsk, bestBid);
    }

    // function placeTrades(address bathAssetAddress,address bathQuoteAddress, 
    //      order memory ask, order memory bid) internal returns (bool) {

    // }
    function placeTrades(address bathAssetAddress,address bathQuoteAddress, 
        order memory ask, order memory bid) internal returns (bool) {
        uint256 newAskID =
            BathToken(bathAssetAddress).placeOffer(
                ask.pay_amt,
                ask.pay_gem,
                ask.buy_amt,
                ask.buy_gem
            ); // TODO: SafeMath?
        emit LogTrade(ask.pay_amt,
                ask.pay_gem,
                ask.buy_amt,
                ask.buy_gem);
        // outstandingAskIDs.push(newAskID);

        uint256 newBidID =
            BathToken(bathQuoteAddress).placeOffer(
                bid.pay_amt,
                bid.pay_gem,
                bid.buy_amt,
                bid.buy_gem
            ); // TODO: SafeMath?
        emit LogTrade(bid.pay_amt,
                bid.pay_gem,
                bid.buy_amt,
                bid.buy_gem);
        // outstandingBidIDs.push(newBidID);
        outstandingPairIDs.push([newAskID, newBidID]);
    }

    function rebalancePair() external {
        //function to rebalance the descrepencies in bathBalance between the tokens of this pair...
        // get the balance of each pair and determine inventory levels
    }

    function execute(address underlyingAsset, address bathAssetAddress, address underlyingQuote, address bathQuoteAddress) onlyPairs external {
        // main function to chain the actions of a single strategic market making transaction

        placePairsTrade(5, underlyingAsset, bathAssetAddress, underlyingQuote, bathQuoteAddress);

        // This should simply be dynamic placing of pairs based on balances
        // manageInventory();
    }

}