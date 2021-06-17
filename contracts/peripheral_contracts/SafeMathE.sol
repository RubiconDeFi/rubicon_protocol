// SPDX-License-Identifier: UNLICENSED

pragma solidity =0.7.6;

// a library for performing overflow-safe math, courtesy of DappHub (https://github.com/dapphub/ds-math)

library SafeMathE {
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x, "ds-math-add-overflow");
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, "ds-math-mul-overflow");
    }

    // https://ethereum.stackexchange.com/questions/80642/how-can-i-use-the-mathematical-constant-e-in-solidity/80643
    // e represented as eN / eD
    // Careful of integer overflow here
    uint256 constant eNum = 271828;
    uint256 constant eDen = 100000;

    // function eN constant returns
    function eN() internal pure returns (uint256) {
        return eNum;
    }

    function eD() internal pure returns (uint256) {
        return eDen;
    }
}
