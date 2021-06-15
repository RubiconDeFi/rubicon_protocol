// @unsupported: ovm - it was real aqueduct
pragma solidity ^0.5.16;

import "./RBCN.sol";

// This contract aims to serve as a holder of the community's RBCN
contract Aqueduct {
    address public RBCNAddress;

    address public RubiconMarketAddress;

    uint256 public distributionDuration;

    address public owner;

    /// @notice The address of the Rubicon governance token
    RBCNInterface public RBCN;

    uint256 public timeOfLastRBCNDist;

    uint256 public propToMakers; // the number out of 100 that represents proportion of an RBCN trade distribution to go to Maker vs. Taker

    event Distribution(address recipient, uint256 amount, uint256 timestamp);

    constructor(uint256 communityDuration, address _owner) public {
        require(communityDuration != 0);
        owner = _owner;
        distributionDuration = communityDuration;
        // Initial 60/40 distribution of RBCN between makers and takers
        propToMakers = 60;
    }

    function setDistributionParams(address _RBCNAddress, address RubiconMarket)
        external
        onlyOwner
        returns (bool)
    {
        RBCNAddress = _RBCNAddress;
        RubiconMarketAddress = RubiconMarket;
        RBCN = RBCNInterface(RBCNAddress);
        timeOfLastRBCNDist = RBCN.getDistStartTime();
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Throws if called by any account other than the current Rubicon Exchange.
     */
    modifier onlyExchange() {
        require(isExchange(), "Caller is not the Rubicon Market");
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == owner;
    }

    /**
     * @dev Safe subtraction function
     */
    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }

    /**
     * @dev Returns true if the caller is the current Rubicon Exchange.
     */
    function isExchange() public view returns (bool) {
        return msg.sender == RubiconMarketAddress;
    }

    /**
     * @dev Admin has the ability to choose a new exchange.
     */
    function setNewExchange(address newImplementation)
        external
        onlyOwner
        returns (bool)
    {
        RubiconMarketAddress = newImplementation;
    }

    /**
     * @dev Only the owner can set a new owner. Timelock can be set as owner
     */
    function setOwner(address newOwner) public onlyOwner returns (bool) {
        owner = newOwner;
    }

    function getRBCNAddress() public view returns (address) {
        return RBCNAddress;
    }

    // Should return the proportion of RBCN distribution per block that
    // is allocated to a Maker of a trade
    // The allocation that goes to the Taker is 1 - % to Maker
    function getPropToMakers() public view returns (uint256) {
        return propToMakers;
    }

    function setPropToMakers(uint256 newProp)
        external
        onlyOwner
        returns (bool)
    {
        propToMakers = newProp;
        return true;
    }

    function distributeGovernanceToken(address recipient, uint256 amount)
        internal
        returns (bool)
    {
        require(
            msg.sender == RubiconMarketAddress,
            "caller is not Rubicon Market"
        );
        require(RBCN.transfer(recipient, amount), "transfer of RBCN failed");
        emit Distribution(recipient, amount, block.timestamp);
        return true;
    }

    //This function should distribute a time-weighted RBCN allocation
    function distributeToMakerAndTaker(address maker, address taker)
        external
        onlyExchange
        returns (bool)
    {
        require(
            timeOfLastRBCNDist < block.timestamp,
            "timeOfLastRBCNDist < block.timestamp"
        );
        require(taker != address(0), "taker is zero address");
        require(maker != address(0), "maker is zero address");
        require(
            block.timestamp <= RBCN.getDistEndTime(),
            "RBCN Distribution is over"
        );

        //calculate change in time from last distribution to now
        uint256 delta = sub(block.timestamp, timeOfLastRBCNDist);

        //calculate quantity to send maker and taker
        uint256 distQuanityMaker =
            (getPropToMakers() * (delta) * RBCN.getDistRate()) / 100;
        uint256 distQuanityTaker =
            (((100 - getPropToMakers())) * (delta) * RBCN.getDistRate()) / 100;

        // TO DO: Extrapolate everything to Aqueduct?
        //send to Maker distQuanityMaker
        require(
            distributeGovernanceToken(maker, distQuanityMaker),
            "distribution to maker failed"
        );

        //send to Taker distQuanityTaker
        require(
            distributeGovernanceToken(taker, distQuanityTaker),
            "distribution to taker failed"
        );

        //time of timeOfLastRBCNDist is set immediately after distribution is made
        timeOfLastRBCNDist = block.timestamp;

        return true;
    }
}

interface RBCNInterface {
    function getPriorVotes(address account, uint256 blockNumber)
        external
        view
        returns (uint96);

    function getDistRate() external pure returns (uint256);

    function getDistStartTime() external view returns (uint256);

    function getDistEndTime() external view returns (uint256);

    function transfer(address, uint256) external returns (bool);
}
