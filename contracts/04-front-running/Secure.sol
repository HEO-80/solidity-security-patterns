// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CommitReveal
 * @notice SECURE CONTRACT — prevents front-running via Commit-Reveal pattern
 * @dev Instead of submitting the solution directly, users commit to a hash 
 *      of (solution + salt). This hides the solution until the reveal phase.
 */
contract CommitReveal {
    struct Commit {
        bytes32 commitHash;
        uint256 blockNumber;
        bool revealed;
    }

    bytes32 public constant targetHash = 0x564ccaf7594d66b1eaaea24fe01f0585bf52ee70852af4eac0cc4b04711cd0e2;
    mapping(address => Commit) public commits;
    uint256 public reward = 10 ether;

    constructor() payable {
        require(msg.value == 10 ether, "Must fund with 10 ETH");
    }

    /**
     * @notice Step 1: Submit the hash of your solution + a secret salt.
     * @dev An attacker seeing this hash in the mempool cannot derive the solution.
     */
    function commit(bytes32 _commitHash) external {
        commits[msg.sender] = Commit({
            commitHash: _commitHash,
            blockNumber: block.number,
            revealed: false
        });
    }

    /**
     * @notice Step 2: Reveal the solution and the salt after at least 1 block.
     * @dev The contract verifies that the (solution + salt) matches the original commit.
     */
    function reveal(string memory _solution, bytes32 _salt) external {
        Commit storage userCommit = commits[msg.sender];
        
        require(userCommit.blockNumber > 0, "No commit found");
        require(userCommit.blockNumber < block.number, "Cannot reveal in the same block");
        require(!userCommit.revealed, "Already revealed");

        // Verify commit: commitHash == keccak256(solution, salt, sender)
        // Including msg.sender in the hash prevents someone from stealing your commit
        require(
            keccak256(abi.encodePacked(_solution, _salt, msg.sender)) == userCommit.commitHash,
            "Commit mismatch"
        );

        // Verify puzzle solution
        require(keccak256(abi.encodePacked(_solution)) == targetHash, "Incorrect solution");

        userCommit.revealed = true;
        (bool sent, ) = msg.sender.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
