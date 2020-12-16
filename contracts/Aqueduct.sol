pragma solidity ^0.5.12;

import "./RBCN.sol";

// This contract aims to serve as a holder of the community's RBCN
contract Aqueduct {

    address public RBCNAddress;

    address public RubiconMarketAddress;

    uint public distributionDuration;

    address public owner;

    constructor(uint communityDuration, address _owner) public {
        require(communityDuration > block.timestamp);
        owner = _owner;
        distributionDuration = communityDuration;

    }
    
    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyExchange() {
        require(isExchange(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isExchange() public view returns (bool) {
        return msg.sender == RubiconMarketAddress;
    }

    function setDistributionParams(address _RBCNAddress, address RubiconMarket) public onlyOwner returns (bool) {
        RBCNAddress = _RBCNAddress;
        RubiconMarketAddress = RubiconMarket;
    }


    function distributeGovernanceToken(address recipient, uint amount) public onlyExchange returns (bool) {
        require(RBCN(RBCNAddress).transfer(recipient, amount));
        return true;
    }

}