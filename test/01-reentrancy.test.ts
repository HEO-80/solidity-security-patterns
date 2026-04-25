import { expect } from "chai";
import hre from "hardhat";

describe("01 - Reentrancy Attack", function () {
  let ethers;
  let owner, attacker;

  before(async function () {
    const connection = await hre.network.getOrCreate();
    ethers = connection.ethers;
    [owner, attacker] = await ethers.getSigners();
  });

  describe("VulnerableBank", function () {
    let bank;

    beforeEach(async function () {
      const Bank = await ethers.getContractFactory("VulnerableBank");
      bank = await Bank.deploy();
      await bank.waitForDeployment();
      await bank.connect(owner).deposit({ value: ethers.parseEther("5.0") });
    });

    it("allows an attacker to drain the bank via reentrancy", async function () {
      const Attack = await ethers.getContractFactory("ReentrancyAttacker");
      const attackContract = await Attack.connect(attacker).deploy(await bank.getAddress());
      await attackContract.waitForDeployment();

      const bankBefore = await bank.getBalance();
      expect(bankBefore).to.equal(ethers.parseEther("5.0"));

      await attackContract.connect(attacker).attack({ value: ethers.parseEther("1.0") });

      const bankAfter = await bank.getBalance();
      expect(bankAfter).to.equal(0n);
      console.log(`    💀 Bank drained: ${ethers.formatEther(bankBefore)} ETH → ${ethers.formatEther(bankAfter)} ETH`);
    });
  });

  describe("SecureBank", function () {
    let bank;

    beforeEach(async function () {
      const Bank = await ethers.getContractFactory("SecureBank");
      bank = await Bank.deploy();
      await bank.waitForDeployment();
      await bank.connect(owner).deposit({ value: ethers.parseEther("5.0") });
    });

    it("blocks the reentrancy attack — exploit reverts", async function () {
      const Attack = await ethers.getContractFactory("ReentrancyAttacker");
      const attackContract = await Attack.connect(attacker).deploy(await bank.getAddress());
      await attackContract.waitForDeployment();

      await expect(
        attackContract.connect(attacker).attack({ value: ethers.parseEther("1.0") })
      ).to.revert(ethers);

      const bankAfter = await bank.getBalance();
      expect(bankAfter).to.equal(ethers.parseEther("5.0"));
      console.log(`    🛡️  Attack blocked — bank balance intact: ${ethers.formatEther(bankAfter)} ETH`);
    });
  });
});
