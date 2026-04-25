// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title FindThisHash
 * @notice VULNERABLE CONTRACT — demonstrates front-running
 * @dev This contract offers a reward to the first person who finds the string 
 *      that hashes to a specific target. Because transactions are public in 
 *      the mempool, an attacker can see the solution and front-run the victim.
 */
contract FindThisHash {
    bytes32 public constant targetHash = 0x564ccaf7594d66b1eaaea24fe01f0585bf52ee70852af4eac0cc4b04711cd0e2;
    uint256 public reward = 10 ether;

    constructor() payable {
        require(msg.value == 10 ether, "Must fund with 10 ETH");
    }

    /**
     * @dev To win, you must find the string that produces the targetHash.
     *      VULNERABILITY: An attacker can see the `_solution` in the mempool 
     *      and send the same transaction with higher gas price.
     */
    function solve(string memory _solution) external {
        require(keccak256(abi.encodePacked(_solution)) == targetHash, "Incorrect solution");

        (bool sent, ) = msg.sender.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
