// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title VulnerableBank
 * @notice DO NOT USE IN PRODUCTION — demonstrates reentrancy vulnerability
 * @dev The classic reentrancy bug: balance is updated AFTER the external call.
 *      An attacker contract can re-enter withdraw() before the balance is zeroed.
 *      Real exploit: The DAO hack (2016) — $60M drained via this exact pattern.
 */
contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        // ❌ VULNERABLE: external call BEFORE state update
        // Attacker's receive() re-enters here while balance is still > 0
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        // Too late — attacker already drained the contract
        balances[msg.sender] = 0;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}