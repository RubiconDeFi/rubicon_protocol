pragma solidity =0.5.16;

import "../interfaces/IBathToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../peripheral_contracts/SafeMath.sol";
import "../RubiconMarket.sol";
import "./Strategy.sol";
import "./BathHouse.sol";

contract BathToken is IBathToken {
    using SafeMath for uint256;

    string public symbol;
    address public underlyingToken;
    address public RubiconMarketAddress;

    // admin
    address public bathHouse;

    string public constant name = "BathToken V-1";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
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
        address token,
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
        //add a check to make sure only a fixed proportion of the pool can be outstanding on orders

        //place offer in RubiconMarket
        // to do: change to make() ? also --- add infinite approval to Rubicon Market on this contract?
        IERC20(address(pay_gem)).approve(RubiconMarketAddress, pay_amt);

        uint256 id =
            RubiconMarket(RubiconMarketAddress).offer(
                pay_amt,
                pay_gem,
                buy_amt,
                buy_gem
            ); // TODO: SafeMath?
        emit LogTrade(pay_amt, pay_gem, buy_amt, buy_gem);
        return (id);
    }

    function withdraw(address from, uint256 value) external onlyPair {
        IERC20(underlyingToken).transfer(from, value);
        _burn(from, value);
    }

    function rebalance(address sisterBath, address underlying)
        external
        onlyPair
    {
        IERC20(underlying).transfer(
            sisterBath,
            IERC20(underlying).balanceOf(address(this))
        );
    }

    function mint(address to, uint256 value) external {
        require(
            IERC20(underlyingToken).balanceOf(msg.sender) >= value,
            "not enough token to mint"
        );
        IERC20(underlyingToken).transferFrom(msg.sender, address(this), value);
        _mint(to, value);

        diveInTheBath[msg.sender] = now;

        // Time stamp and update yield
        updateYield();
    }

    // Function that is called to log yield over time
    // This function should track cumulative yield at a given timestamp
    // e.g. [5 USDC, 2:30pm], [7 USDC, 2:45pm]
    // This way we can log when a user enters the pool (mint) and when they exit give them:
    // (tExit - tEnter) => (ExitCumuYield - EnterCumuYield) * (bathTokenAmount / Total)
    // TODO: add a test for yield tracking
    function updateYield() internal {
        uint256 yieldAmount =
            IERC20(underlyingToken).balanceOf(address(this)) - totalSupply;
        if (yieldTracker.length == 0) {
            yieldTracker.push([yieldAmount, now]);
            emit LogYield(yieldAmount);
            return;
        }

        uint256 oldTotal = yieldTracker[yieldTracker.length - 1][0];
        yieldTracker.push([yieldAmount + oldTotal, now]);
    }

    // TODO: add a burn test
    function burn(uint256 value) external {
        require(balanceOf[msg.sender] >= value, "not enough token to burn");

        // Determine underlying - issuedBath tokens
        updateYield();

        uint256 currentYield = yieldTracker[yieldTracker.length - 1][0];
        // Withdraw user's underlying and portion of yield if positive
        uint256 delta = currentYield - diveInTheBath[msg.sender];
        if (delta > 0) {
            uint256 userYield = (balanceOf[msg.sender] * delta) / totalSupply;
            IERC20(underlyingToken).transfer(msg.sender, value + userYield);
        } else {
            uint256 userYield = 0;
            IERC20(underlyingToken).transfer(msg.sender, value + userYield);
        }
        // get (Yield now - starting yield) * your portion of the pool
        _burn(msg.sender, value);
    }

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
