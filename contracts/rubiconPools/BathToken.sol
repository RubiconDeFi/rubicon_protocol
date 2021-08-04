// SPDX-License-Identifier: BUSL-1.1

/// @author Benjamin Hughes - Rubicon
/// @notice This contract represents a single-asset liquidity pool for Rubicon Pools
/// @notice Any user can deposit assets into this pool and earn yield from successful strategist market making with their liquidity
/// @notice This contract looks to both BathPairs and the BathHouse as its admin

pragma solidity =0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../RubiconMarket.sol";
import "./BidAskUtil.sol";
import "./BathHouse.sol";

contract BathToken {
  using SafeMath for uint256;
  bool public initialized;

  string public symbol;
  string public name;
  uint8 public decimals;

  address public RubiconMarketAddress;
  address public bathHouse; // admin
  address public feeTo;
  IERC20 public underlyingToken;
  uint256 public feeBPS;

  uint256 public totalSupply;
  uint256 public outstandingAmount; // quantity of underlyingToken that is in the orderbook and still in pools
  uint256[] outstandingIDs;
  mapping(uint256 => uint256) id2Ind;

  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;

  bytes32 public DOMAIN_SEPARATOR;
  // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
  bytes32 public constant PERMIT_TYPEHASH =
    0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
  mapping(address => uint256) public nonces;

  event Approval(address indexed owner, address indexed spender, uint256 value);
  event Transfer(address indexed from, address indexed to, uint256 value);
  event LogTrade(
    uint256 pay_amt,
    ERC20 pay_gem,
    uint256 buy_amt,
    ERC20 buy_gem
  );
  event LogInit(uint256 timeOfInit);

  /// @dev Proxy-safe initialization of storage
  function initialize(
    string memory bathName,
    IERC20 token,
    address market,
    address _bathHouse,
    address _feeTo
  ) external {
    require(!initialized);
    symbol = bathName;
    underlyingToken = token;
    RubiconMarketAddress = market;
    bathHouse = _bathHouse;

    uint256 chainId;
    assembly {
      chainId := chainid()
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
    name = "BathToken v1";
    decimals = 18;

    require(
      RubiconMarket(RubiconMarketAddress).initialized() &&
        BathHouse(bathHouse).initialized()
    );

    // Add infinite approval of Rubicon Market for this asset

    IERC20(address(token)).approve(RubiconMarketAddress, 2**256 - 1);
    emit LogInit(block.timestamp);

    feeTo = _feeTo; //BathHouse admin is initial recipient
    feeBPS = 0; //Fee set to zero

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

  function setMarket(address newRubiconMarket) external {
    require(msg.sender == bathHouse && initialized);
    RubiconMarketAddress = newRubiconMarket;
  }

  function setBathHouse(address newBathHouse) external {
    require(msg.sender == bathHouse && initialized);
    bathHouse = newBathHouse;
  }

  function setFeeBPS(uint256 _feeBPS) external {
    require(msg.sender == bathHouse && initialized);
    feeBPS = _feeBPS;
  }

  function setFeeTo(address _feeTo) external {
    require(msg.sender == bathHouse && initialized);
    feeTo = _feeTo;
  }

  // Rubicon Market Functions:
  // pass initAmt as zero if unsure
  function cancel(uint256 id, uint256 initAmt) external onlyPair {
    if (initAmt == 0) {
      (uint256 pay_amt, , , ) = RubiconMarket(RubiconMarketAddress).getOffer(
        id
      );
      outstandingAmount = outstandingAmount.sub(pay_amt);
    } else {
      outstandingAmount = outstandingAmount.sub(initAmt);
    }
    RubiconMarket(RubiconMarketAddress).cancel(id);
  }

  function removeFilledTradeAmount(uint256 amt) external onlyPair {
    outstandingAmount = outstandingAmount.sub(amt);
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
    uint256 id = RubiconMarket(RubiconMarketAddress).offer(
      pay_amt,
      pay_gem,
      buy_amt,
      buy_gem,
      0,
      false
    );
    outstandingAmount = outstandingAmount.add(pay_amt);
    return (id);
  }

  function underlying() external view returns (address) {
    require(initialized);
    return address(underlyingToken);
  }

  /// @notice returns the amount of underlying ERC20 tokens in this pool in addition to
  ///         any tokens that may be outstanding in the Rubicon order book
  function underlyingBalance() public view returns (uint256) {
    require(initialized, "BathToken not initialized");

    uint256 _pool = IERC20(underlyingToken).balanceOf(address(this));
    return _pool.add(outstandingAmount);
  }

  // https://github.com/yearn/yearn-protocol/blob/develop/contracts/vaults/yVault.sol - shoutout yEarn homies
  function deposit(uint256 _amount) external {
    uint256 _pool = underlyingBalance();
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
  function withdraw(uint256 _shares) external {
    uint256 r = (underlyingBalance().mul(_shares)).div(totalSupply);
    _burn(msg.sender, _shares);

    uint256 _fee = r.mul(feeBPS).div(10000);
    IERC20(underlyingToken).transfer(feeTo, _fee);

    underlyingToken.transfer(msg.sender, r.sub(_fee));
  }

  // This function returns filled orders to the correct liquidity pool and sends strategist rewards to the Pair
  function rebalance(
    address sisterBath,
    address underlyingAsset, /* sister asset */
    uint256 stratProportion
  ) external onlyPair {
    require(stratProportion > 0 && stratProportion < 50 && initialized);
    uint256 stratReward = (
      stratProportion.mul(IERC20(underlyingAsset).balanceOf(address(this)))
    )
    .div(10000);
    IERC20(underlyingAsset).transfer(
      sisterBath,
      IERC20(underlyingAsset).balanceOf(address(this)).sub(stratReward)
    );
    IERC20(underlyingAsset).transfer(msg.sender, stratReward);
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
      allowance[from][msg.sender] = allowance[from][msg.sender].sub(value);
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
    require(deadline >= block.timestamp, "bathToken: EXPIRED");
    bytes32 digest = keccak256(
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
      "bathToken: INVALID_SIGNATURE"
    );
    _approve(owner, spender, value);
  }
}
