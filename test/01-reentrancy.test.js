import { expect } from "chai";
import hre from "hardhat";

/**
 * Reentrancy Attack — Test Suite
 *
 * Test 1: Proves the ATTACK works on VulnerableBank (exploit succeeds)
 * Test 2: Proves the DEFENSE works on SecureBank (exploit reverts)
 */
describe("01 - Reentrancy Attack", function () {
  let owner, attacker;

  beforeEach(async function () {
    [owner, attacker] = await hre.ethers.getSigners();
  });

  // ─────────────────────────────────────────────
  // PART 1 — The vulnerable contract gets drained
  // ─────────────────────────────────────────────
  describe("VulnerableBank", function () {
    let bank;

    beforeEach(async function () {
      const Bank = await hre.ethers.getContractFactory("VulnerableBank");
      bank = await Bank.deploy();
      await bank.waitForDeployment();

      await bank.connect(owner).deposit({ value: hre.ethers.parseEther("5.0") });
    });

    it("allows an attacker to drain the bank via reentrancy", async function () {
      const Attack = await hre.ethers.getContractFactory("ReentrancyAttacker");
      const attackContract = await Attack.connect(attacker).deploy(
        await bank.getAddress()
      );
      await attackContract.waitForDeployment();

      const bankBefore = await bank.getBalance();
      expect(bankBefore).to.equal(hre.ethers.parseEther("5.0"));

      await attackContract.connect(attacker).attack({ value: hre.ethers.parseEther("1.0") });

      const bankAfter = await bank.getBalance();
      expect(bankAfter).to.equal(0n);
      console.log(`    💀 Bank drained: ${hre.ethers.formatEther(bankBefore)} ETH → ${hre.ethers.formatEther(bankAfter)} ETH`);
    });
  });

  // ─────────────────────────────────────────────
  // PART 2 — The secure contract blocks the attack
  // ─────────────────────────────────────────────
  describe("SecureBank", function () {
    let bank;

    beforeEach(async function () {
      const Bank = await hre.ethers.getContractFactory("SecureBank");
      bank = await Bank.deploy();
      await bank.waitForDeployment();

      await bank.connect(owner).deposit({ value: hre.ethers.parseEther("5.0") });
    });

    it("blocks the reentrancy attack — exploit reverts", async function () {
      const Attack = await hre.ethers.getContractFactory("ReentrancyAttacker");
      const attackContract = await Attack.connect(attacker).deploy(
        await bank.getAddress()
      );
      await attackContract.waitForDeployment();

      await expect(
        attackContract.connect(attacker).attack({ value: hre.ethers.parseEther("1.0") })
      ).to.be.reverted;

      const bankAfter = await bank.getBalance();
      expect(bankAfter).to.equal(hre.ethers.parseEther("5.0"));
      console.log(`    🛡️  Attack blocked — bank balance intact: ${hre.ethers.formatEther(bankAfter)} ETH`);
    });
  });
});