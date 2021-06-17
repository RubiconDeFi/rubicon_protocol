// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// https://github.com/ethereum/eips/issues/1404
// contract ERC1404 is ERC20 {
//     function detectTransferRestriction (address from, address to, uint256 value) public view returns (uint8);
//     function messageForTransferRestriction (uint8 restrictionCode) public view returns (string memory);
// }

contract EquityToken is ERC20 {
    constructor(address admin, uint256 initialSupply)
        public
        ERC20("Regulation A+ Equity", "EQT")
    {
        _mint(admin, initialSupply);
    }
}
