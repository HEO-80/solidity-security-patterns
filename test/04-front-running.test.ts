import { expect } from "chai";
import hre from "hardhat";

describe("04 - Front-Running Attack", function () {
  let ethers;
  let Vulnerable, vulnerableContract;
  let Secure, secureContract;
  let owner, user, attacker;
  let REWARD;

  before(async function () {
    const connection = await hre.network.getOrCreate();
    ethers = connection.ethers;
    REWARD = ethers.parseEther("10");
    [owner, user, attacker] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy Vulnerable version
    Vulnerable = await ethers.getContractFactory("FindThisHash");
    vulnerableContract = await Vulnerable.deploy({ value: REWARD });

    // Deploy Secure version
    Secure = await ethers.getContractFactory("CommitReveal");
    secureContract = await Secure.deploy({ value: REWARD });
  });

  describe("Exploit in Vulnerable Contract", function () {
    it("Should allow an attacker to win by seeing the solution in the mempool", async function () {
      const solution = "Ethereum";
      
      console.log("    🕵️  Attacker sees solution 'Ethereum' in mempool...");
      
      await vulnerableContract.connect(attacker).solve(solution);

      const contractBalance = await vulnerableContract.getBalance();

      expect(contractBalance).to.equal(0n);
      console.log("    💀 Attacker front-ran the user and stole the 10 ETH reward!");
    });
  });

  describe("Defense in Secure Contract (Commit-Reveal)", function () {
    it("Should prevent front-running because the solution is hidden during commit", async function () {
      const solution = "Ethereum";
      const salt = ethers.encodeBytes32String("secret-salt");
      
      // 1. User commits the hash of (solution + salt + address)
      const commitHash = ethers.solidityPackedKeccak256(
        ["string", "bytes32", "address"],
        [solution, salt, user.address]
      );
      
      await secureContract.connect(user).commit(commitHash);
      console.log("    ✅ User submitted a secret commit.");

      // 2. Attacker tries to reveal the same solution without a commit
      try {
        await secureContract.connect(attacker).reveal(solution, salt);
        expect.fail("Attacker should not be able to reveal without a commit");
      } catch (error) {
        expect(error.message).to.contain("No commit found");
      }

      // 3. Even if the attacker tries to commit now, they can't reveal in the same block
      const attackerCommitHash = ethers.solidityPackedKeccak256(
        ["string", "bytes32", "address"],
        [solution, salt, attacker.address]
      );
      await secureContract.connect(attacker).commit(attackerCommitHash);

      // Advance one block to allow reveal
      await ethers.provider.send("evm_mine", []);

      // 4. User reveals successfully
      await secureContract.connect(user).reveal(solution, salt);
      
      const contractBalance = await secureContract.getBalance();
      expect(contractBalance).to.equal(0n);
      console.log("    🛡️  User successfully claimed reward. Front-running blocked.");
    });
  });
});
