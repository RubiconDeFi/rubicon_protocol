pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";


// https://github.com/ethereum/eips/issues/1404
// contract ERC1404 is ERC20 {
//     function detectTransferRestriction (address from, address to, uint256 value) public view returns (uint8);
//     function messageForTransferRestriction (uint8 restrictionCode) public view returns (string memory);
// }

contract EquityToken is ERC20Detailed, ERC20 {
    constructor(address admin, uint256 initialSupply) ERC20Detailed("Regulation A+ Equity", "EQT", 18) public {
        _mint(admin, initialSupply);
    }

}
