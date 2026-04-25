const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("03 - Access Control Failure", function () {
  let Vulnerable, vulnerableContract;
  let Secure, secureContract;
  let owner, user1, user2, attacker;

  const DEPOSIT_AMOUNT = ethers.parseEther("5"); // 5 ETH por usuario

  beforeEach(async function () {
    [owner, user1, user2, attacker] = await ethers.getSigners();

    // Desplegar versión Vulnerable
    Vulnerable = await ethers.getContractFactory("VaultVulnerable");
    vulnerableContract = await Vulnerable.deploy();

    // Desplegar versión Segura
    Secure = await ethers.getContractFactory("VaultSecure");
    secureContract = await Secure.deploy();
  });

  describe("Exploit en Contrato Vulnerable", function () {
    it("Debería permitir a CUALQUIERA vaciar el contrato", async function () {
      // 1. Usuarios legítimos depositan fondos en la bóveda
      await vulnerableContract.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      await vulnerableContract.connect(user2).deposit({ value: DEPOSIT_AMOUNT });

      const vaultBalanceAntes = await ethers.provider.getBalance(vulnerableContract.target);
      expect(vaultBalanceAntes).to.equal(ethers.parseEther("10")); // 10 ETH total

      // 2. El atacante llama a la función sin protección
      // No necesita enviar ETH, solo ejecutar la función
      await expect(
        vulnerableContract.connect(attacker).emergencyWithdrawAll()
      ).not.to.be.reverted;

      // 3. Verificamos que la bóveda quedó vacía
      const vaultBalanceDespues = await ethers.provider.getBalance(vulnerableContract.target);
      expect(vaultBalanceDespues).to.equal(0n);
    });
  });

  describe("Defensa en Contrato Seguro", function () {
    it("Debería bloquear al atacante y solo permitir al owner retirar", async function () {
      // 1. Usuarios depositan fondos
      await secureContract.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      
      // 2. El atacante intenta vaciar la bóveda
      await expect(
        secureContract.connect(attacker).emergencyWithdrawAll()
      ).to.be.revertedWith("Acceso denegado: No eres el owner");

      // 3. El Owner legítimo SÍ puede llamar a la función
      await expect(
        secureContract.connect(owner).emergencyWithdrawAll()
      ).not.to.be.reverted;

      // 4. Verificamos que los fondos se extrajeron de forma segura
      const vaultBalanceDespues = await ethers.provider.getBalance(secureContract.target);
      expect(vaultBalanceDespues).to.equal(0n);
    });
  });
});