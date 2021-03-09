pragma solidity =0.5.16;

import "./peripheral_contracts/IBathToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./peripheral_contracts/SafeMath.sol";
import "./RubiconMarket.sol";

contract BathToken is IBathToken {
    using SafeMath for uint256;

    address public pair;
    string public symbol;
    address public underlyingToken;
    address public RubiconMarketAddress;

    string public constant name = "BathToken V-1";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    bytes32 public DOMAIN_SEPARATOR;
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH =
        0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    mapping(address => uint256) public nonces;

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

    constructor(
        string memory bathName,
        address token,
        address market
    ) public {
        pair = msg.sender;
        symbol = bathName;
        underlyingToken = token;
        RubiconMarketAddress = market;

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
    }

    modifier onlyPair {
        require(msg.sender == pair);
        _;
    }

    function cancel(uint id) external onlyPair {
        RubiconMarket(RubiconMarketAddress).cancel(id);
    }

    //onlyRubiconMarket - functionality that only allows the smart contract to send funds to the live Rubicon Market instance

    // function that places a bid/ask in the orderbook for a given pair
    function placeOffer(
        uint256 pay_amt,
        ERC20 pay_gem,
        uint256 buy_amt,
        ERC20 buy_gem
    ) external onlyPair returns (uint256) {
        //add a check to make sure only a fixed proportion of the pool can be outstanding on orders

        //place offer in RubiconMarket
        // to do: change to make() ?
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
        // add security checks
        IERC20(underlyingToken).transfer(from, value);
        _burn(from, value);

        // TODO: emit
    }

    function mint(address to, uint256 value) external onlyPair {
        _mint(to, value);
        // TODO: emit
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
