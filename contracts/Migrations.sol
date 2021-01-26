pragma solidity ^0.5.16;

contract Migrations {
    address public owner;
    uint256 public last_completed_migration;
    TimelockInterface public timelock;

    constructor() public {
        owner = msg.sender;
    }

    modifier restricted() {
        if (msg.sender == owner) _;
    }

    function setCompleted(uint256 completed) public restricted {
        last_completed_migration = completed;
    }

    function setAuthSchemeOfSystem(address timelock_, address senate_)
        public
        restricted
    {
        require(msg.sender == owner);
        timelock = TimelockInterface(timelock_);
        // queueTransaction to set pendingAdmin
        timelock.queueTransaction(
            address(timelock_),
            0,
            "setPendingAdmin(address)",
            abi.encode(senate_),
            block.timestamp
        );
        // execute transaction to set pendingAdmin
        timelock.executeTransaction(
            address(timelock_),
            0,
            "setPendingAdmin(address)",
            abi.encode(senate_),
            block.timestamp
        );
        //admin accepted when senate calls
    }
}

interface TimelockInterface {
    function delay() external view returns (uint256);

    function GRACE_PERIOD() external view returns (uint256);

    function acceptAdmin() external;

    function queuedTransactions(bytes32 hash) external view returns (bool);

    function queueTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external returns (bytes32);

    function cancelTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external;

    function executeTransaction(
        address target,
        uint256 value,
        string calldata signature,
        bytes calldata data,
        uint256 eta
    ) external payable returns (bytes memory);
}
