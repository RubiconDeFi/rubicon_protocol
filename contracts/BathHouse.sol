pragma solidity =0.5.16;
import "./BathToken.sol";

contract BathHouse {
    string name = 'ETH / USDC Liquidity Pool';
    string name1 = 'BathHouse';

    address[] public allBathPairs;
    mapping(address => mapping(address => address)) public getPair;

    //****Acts as the initializer/factory of BathTokens*****
    //*** Acts as quarterback for BathToken interactions:*/
    // e.g. init them, placePairs trade

    // Build / Test flow:
    // 1. [] Init a bathPair
    // 2. [] Allow users to deposit liquidity into bath pair w/ custom weights while receiving Token
    // 3. [] Test BathHouse calling on bath tokens ability to place pairs placePairsTrade <- build this logic
    // 4. [] test a withdrawl... place 


    //deposit() - a function that should allow a user to deposit custom weights into a given pair
    // inputs: custom weights into the pool (x and 1-x), and native assets
    // outputs: return to the user a custom bathASSET and bathQUOTE in accordance to the pair
    //  needs to account for when a user deposits funds to correctly pay them back the right amount of yield

    function deposit(address asset, uint assetWeight, address quote, uint quoteWeight) external returns (address bathAsset, address bathQuote) {
        // require(bathTokens exist)
        require(asset != quote);
        require(assetWeight <= 100);
        require(assetWeight >= 0);
        require(quoteWeight <= 100);
        require(quoteWeight >= 0);
        
        // mint the bathTokens to the user in accordance to weights, send underlying assets to each Bath Token


        //filler for return values
        address bathAsset = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
        address bathQuote = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
        return (bathAsset, bathQuote);
    }

    function initBathPair(address asset, address quote) public returns (address newPair) {
        //calls initialize on two Bath Tokens and spins them up
        require(asset != quote);
        require(asset != address(0));
        require(quote != address(0));
        require(getPair[asset][quote] == address(0), "Bath Pair already exists");
        
        // Create the new contract at call!
        // bytes memory bytecode = type(BathToken).creationCode;
        // bytes32 salt = keccak256(abi.encodePacked(asset, quote)); //arbitrary data to get new Hash
        // assembly {
        //     pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        // }
        // IBathToken(pair).initialize(quote, asset);
        // allBathPairs.push(pair);
        // getPair[asset][quote] = pair;

        BathToken pair = new BathToken();
        address newPair = address(pair);
        allBathPairs.push(newPair);
        pair.initialize(quote, asset);
        getPair[asset][quote] = newPair;        
        return newPair;
    }

    function getBathPair(address asset, address quote) public view returns(address pair){
        return getPair[asset][quote];
    }


    //withdraw() - a function that should allow a user to send their bathASSET and bathQUOTE to the smart contract to withdraw provided liquidity
    // inputs: bathASSET and bathQUOTE tokens
    // outputs: receive the underlying + any yield and RBCN earned from their stake in the pool

    //onlyRubiconMarket - functionality that only allows the smart contract to send funds to the live Rubicon Market instance

    //placePairsTrade() - a function that places a bid and ask in the orderbook for the BathHouse's pair into the RubiconMarket orderbook
    // inputs: spread - the desired spread the pair of bid + ask should be placed outside of the midpoint of the orderbook
    // output: success or failure - log pair placed => note who the keeper is and store trade details in memory so next time placePairsTrade is called the keeper gets paid
    // Flow:
    //  1. cancel any partial fills previously made by this function call
    //  2. pay the keeper of said partial fill from the portion that was filled
    //  3. Identify new midpoint of orderbook
    //  4. perform sanity check to make sure this midpoint makes sense / no manipulation ?
    //  5. place new pair and save information

    // getMidpoint() - function to return the current midpoint/price of the orderbook while performing sanity checks if needed
}