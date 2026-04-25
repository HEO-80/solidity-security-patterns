// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SecureBank
 * @notice Production-safe version — two layers of reentrancy protection
 * @dev Fix 1: Checks-Effects-Interactions pattern (balance zeroed BEFORE call)
 *      Fix 2: OpenZeppelin ReentrancyGuard as a second safety net
 *      Both together = defense in depth
 */
contract SecureBank is ReentrancyGuard {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // nonReentrant modifier blocks any re-entry attempt at the EVM level
    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        // ✅ FIX 1 — Checks-Effects-Interactions (CEI)
        // State is updated BEFORE the external call
        balances[msg.sender] = 0;

        // ✅ FIX 2 — nonReentrant guard prevents re-entry even if CEI fails somehow
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}