pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

//represents a stake in underlying liquidity of pair-based bath pool...

contract BathToken is ERC20 {

    address public bathHouse;
    // mint() - function that mints to the user a bathToken for this token's asset
    //     should only be callable from the BathHouse

    // ERC20 - token needs to adapt the ERC20 interface

    // burn() - need ability to burn bath tokens when a user withdraws liquidity from a pool

    constructor () public {
        bathHouse = msg.sender;
    }

    // initialize() -start the token 
    function initialize(address quote, address asset) external {
        require(msg.sender == bathHouse, "caller must be Bath House");

    }

}

interface IBathToken {
    function initialize(address, address) external;

}