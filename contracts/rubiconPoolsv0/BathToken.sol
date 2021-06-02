/// @author Benjamin Hughes - Rubicon
/// @notice This contract represents a single-asset liquidity pool for Rubicon Pools
/// @notice Any user can deposit assets into this pool and earn yield from successful strategist market making with their liquidity
/// @notice This contract looks to both BathPairs and the BathHouse as its admin

pragma solidity =0.5.16;

import "../interfaces/IBathToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
// import "../peripheral_contracts/SafeMath.sol";
import "../RubiconMarket.sol";
import "./PairsTrade.sol";
import "./BathHouse.sol";

contract BathToken is IBathToken {
    // using SafeERC20 for IERC20;
    // using Address for address;
    using SafeMath for uint256;

    string public symbol;
    IERC20 public underlyingToken;
    address public RubiconMarketAddress;

    // admin
    address public bathHouse;

    string public constant name = "BathToken v1";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    // This maps a user's address to cumulative pool yield at the time of deposit
    mapping(address => uint256) public diveInTheBath;
    mapping(address => mapping(address => uint256)) public allowance;

    // This tracks cumulative yield over time [amount, timestmap]
    // amount should be token being passed from another bathToken to this one (pair) - market price at the time
    uint256[2][] public yieldTracker;

    bytes32 public DOMAIN_SEPARATOR;
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH =
        0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    mapping(address => uint256) public nonces;
    bool public initialized;

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Transfer(address indexed from, address indexed to, uint256 value);
    event LogTrade(
        uint256 pay_amt,
        ERC20 pay_gem,
        uint256 buy_amt,
        ERC20 buy_gem
    );
    event LogYield(uint256 yield);

    function initialize(
        string memory bathName,
        IERC20 token,
        address market,
        address _bathHouse
    ) public {
        require(!initialized);
        symbol = bathName;
        underlyingToken = token;
        RubiconMarketAddress = market;
        bathHouse = _bathHouse;

        uint256 chainId;
        assembly {
            chainId := chainid
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );

        // Add infinite approval of Rubicon Market for this asset
        uint256 MAX_INT = 2**256 - 1;
        IERC20(address(token)).approve(RubiconMarketAddress, MAX_INT);

        initialized = true;
    }

    modifier onlyPair {
        require(
            BathHouse(bathHouse).isApprovedPair(msg.sender) == true,
            "not an approved pair - bathToken"
        );
        _;
    }

    modifier onlyApprovedStrategy() {
        require(
            BathHouse(bathHouse).isApprovedStrat(msg.sender) == true,
            "not an approved strategy - bathToken"
        );
        _;
    }

    function cancel(uint256 id) external onlyPair {
        RubiconMarket(RubiconMarketAddress).cancel(id);
    }

    // function that places a bid/ask in the orderbook for a given pair
    function placeOffer(
        uint256 pay_amt,
        ERC20 pay_gem,
        uint256 buy_amt,
        ERC20 buy_gem
    ) external onlyApprovedStrategy returns (uint256) {
        // Place an offer in RubiconMarket
        // The below ensures that the order does not automatically match/become a taker trade **enforceNoAutoFills**
        // while also ensuring that the order is placed in the sorted list
        uint256 id =
            RubiconMarket(RubiconMarketAddress).offer(
                pay_amt,
                pay_gem,
                buy_amt,
                buy_gem,
                0,
                false
            );
        emit LogTrade(pay_amt, pay_gem, buy_amt, buy_gem);
        return (id);
    }

    function underlying() external view returns (address) {
        require(initialized);
        return underlyingToken;
    }

    // https://github.com/yearn/yearn-protocol/blob/develop/contracts/vaults/yVault.sol - shoutout yEarn homies
    function deposit(uint256 _amount) public {
        uint256 _pool = IERC20(underlyingToken).balanceOf(address(this));
        uint256 _before = underlyingToken.balanceOf(address(this));
        underlyingToken.transferFrom(msg.sender, address(this), _amount);
        uint256 _after = underlyingToken.balanceOf(address(this));
        _amount = _after.sub(_before); // Additional check for deflationary tokens
        uint256 shares = 0;
        if (totalSupply == 0) {
            shares = _amount;
        } else {
            shares = (_amount.mul(totalSupply)).div(_pool);
        }
        _mint(msg.sender, shares);
    }

    // No rebalance implementation for lower fees and faster swaps
    function withdraw(uint256 _shares) public {
        uint256 r =
            (IERC20(underlyingToken).balanceOf(address(this)).mul(_shares)).div(
                totalSupply
            );
        _burn(msg.sender, _shares);

        underlyingToken.transfer(msg.sender, r);
    }

    // This function returns filled orders to the correct liquidity pool and sends strategist rewards to the Pair
    function rebalance(
        address sisterBath,
        address underlying, /* sister asset */
        uint256 stratProportion
    ) external onlyPair {
        require(stratProportion > 0 && stratProportion < 20);
        uint256 stratReward =
            (stratProportion * (IERC20(underlying).balanceOf(address(this)))) /
                100;
        IERC20(underlying).transfer(
            sisterBath,
            IERC20(underlying).balanceOf(address(this)) - stratReward
        );
        IERC20(underlying).transfer(msg.sender, stratReward);
    }

    // *** Internal Functions ***

    function _mint(address to, uint256 value) internal {
        totalSupply = totalSupply.add(value);
        balanceOf[to] = balanceOf[to].add(value);
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) internal {
        balanceOf[from] = balanceOf[from].sub(value);
        totalSupply = totalSupply.sub(value);
        emit Transfer(from, address(0), value);
    }

    function _approve(
        address owner,
        address spender,
        uint256 value
    ) private {
        allowance[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) private {
        balanceOf[from] = balanceOf[from].sub(value);
        balanceOf[to] = balanceOf[to].add(value);
        emit Transfer(from, to, value);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool) {
        if (allowance[from][msg.sender] != uint256(-1)) {
            allowance[from][msg.sender] = allowance[from][msg.sender].sub(
                value
            );
        }
        _transfer(from, to, value);
        return true;
    }

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(deadline >= block.timestamp, "UniswapV2: EXPIRED");
        bytes32 digest =
            keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    DOMAIN_SEPARATOR,
                    keccak256(
                        abi.encode(
                            PERMIT_TYPEHASH,
                            owner,
                            spender,
                            value,
                            nonces[owner]++,
                            deadline
                        )
                    )
                )
            );
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(
            recoveredAddress != address(0) && recoveredAddress == owner,
            "UniswapV2: INVALID_SIGNATURE"
        );
        _approve(owner, spender, value);
    }
}
