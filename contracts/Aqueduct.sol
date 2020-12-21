pragma solidity ^0.5.12;

import "./RBCN.sol";

// This contract aims to serve as a holder of the community's RBCN
contract Aqueduct {

    address public RBCNAddress;

    address public RubiconMarketAddress;

    uint public distributionDuration;

    address public owner;

    event Distribution( address recipient, uint amount, uint timestamp);

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
     * @dev Throws if called by any account other than the Rubicon Exchange.
     */
    modifier onlyExchange() {
        require(isExchange(), "Caller is not the Rubicon Market");
        _;
    }

    /**
     * @dev Returns true if the caller is the current Rubicon Exchange.
     */
    function isExchange() public view returns (bool) {
        return msg.sender == RubiconMarketAddress;
    }

    function setDistributionParams(address _RBCNAddress, address RubiconMarket) public onlyOwner returns (bool) {
        RBCNAddress = _RBCNAddress;
        RubiconMarketAddress = RubiconMarket;
    }


    function distributeGovernanceToken(address recipient, uint amount) public onlyExchange returns (bool) {
        require(msg.sender == RubiconMarketAddress, "caller is not Rubicon Market");
        require(RBCN(RBCNAddress).transfer(recipient, amount), "transfer of token failed");
        emit Distribution(recipient, amount, block.timestamp);
        return true;
    }

}