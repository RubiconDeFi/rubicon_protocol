// SPDX-License-Identifier: UNLICENSED

// hevm: flattened sources of /nix/store/8xb41r4qd0cjb63wcrxf1qmfg88p0961-dss-6fd7de0/src/dai.sol
pragma solidity =0.7.6;

// import "./IERC20.sol";
import "./ERC20.sol";


contract TokenWithFaucet is ERC20 {
    // --- Auth ---
    mapping(address => uint256) public wards;
    address public admin;
    uint public timeDelay;

    // --- ERC20 Data ---
    string public constant version = "1";
    mapping(address => uint256) public faucetCheck;

    // --- Math ---
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x);
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x);
    }

    constructor(
        address _admin,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) ERC20(_name, _symbol, _decimals) {
        admin = _admin;
        _mint(admin, 1000000e18);
        timeDelay = 5 days;
    }

    // --- Token ---
    function faucet() external returns (bool) {
        if (block.timestamp < faucetCheck[msg.sender] + timeDelay) {
            return false;
        }
        _mint(msg.sender, 1000e18);
        faucetCheck[msg.sender] = block.timestamp;
        return true;
    }

    function adminMint() external {
        require(admin == msg.sender);
        _mint(msg.sender, 10000e18);
    }

    function setTimeDelay(uint256 _timeDelay) external {
        require(admin == msg.sender);
        timeDelay = _timeDelay;
    }

    // --- Alias ---
    function push(address usr, uint256 wad) external {
        transferFrom(msg.sender, usr, wad);
    }

    function pull(address usr, uint256 wad) external {
        transferFrom(usr, msg.sender, wad);
    }

    function move(
        address src,
        address dst,
        uint256 wad
    ) external {
        transferFrom(src, dst, wad);
    }
}
