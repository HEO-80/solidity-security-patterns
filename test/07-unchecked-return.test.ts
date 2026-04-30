import { expect } from "chai";
import hre from "hardhat";

describe("07 - Unchecked Return Values", function () {
  let ethers: any;
  let vulnerableBank: any, secureBank: any;
  let rejectorContract: any;
  let user: any;

  before(async function () {
    const connection = await hre.network.getOrCreate();
    ethers = connection.ethers;
    [user] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // 1. Desplegar los Bancos
    const VulnerableBank = await ethers.getContractFactory("VulnerableBank");
    vulnerableBank = await VulnerableBank.deploy();

    const SecureBank = await ethers.getContractFactory("SecureBank");
    secureBank = await SecureBank.deploy();

    // 2. Desplegar el contrato del usuario (Rejector)
    const Rejector = await ethers.getContractFactory("Rejector");
    rejectorContract = await Rejector.deploy();
  });

  describe("Exploit in Vulnerable Contract", function () {
    it("Should deduct balance even if the Ether transfer fails", async function () {
      const depositAmount = ethers.parseEther("1");

      // El Rejector deposita 1 ETH en el banco vulnerable
      await rejectorContract.connect(user).depositTo(await vulnerableBank.getAddress(), { value: depositAmount });
      
      let balanceInBank = await vulnerableBank.balances(await rejectorContract.getAddress());
      expect(balanceInBank).to.equal(depositAmount);
      console.log("    🏦 Rejector deposited 1 ETH into Vulnerable Bank.");

      // El Rejector intenta retirar. El banco intentará enviarlo, pero Rejector revertirá.
      // Como el banco ignora el error, el test continuará sin crashear.
      console.log("    🕵️  Rejector tries to withdraw. The Ether transfer fails, but the Bank ignores it...");
      await rejectorContract.connect(user).withdrawFrom(await vulnerableBank.getAddress(), depositAmount);

      // Verificamos la contabilidad del banco
      balanceInBank = await vulnerableBank.balances(await rejectorContract.getAddress());
      const bankActualEtherBalance = await ethers.provider.getBalance(await vulnerableBank.getAddress());

      // El sistema dice que el balance es 0, pero el ETH físico sigue dentro del banco
      expect(balanceInBank).to.equal(0n);
      expect(bankActualEtherBalance).to.equal(depositAmount);
      
      console.log("    💀 Rejector's balance was updated to 0, but they never received the ETH. Funds lost!");
    });
  });

  describe("Defense in Secure Contract", function () {
    it("Should revert the whole transaction if the Ether transfer fails", async function () {
      const depositAmount = ethers.parseEther("1");

      // El Rejector deposita 1 ETH en el banco seguro
      await rejectorContract.connect(user).depositTo(await secureBank.getAddress(), { value: depositAmount });
      console.log("    🏦 Rejector deposited 1 ETH into Secure Bank.");

      // El Rejector intenta retirar.
      console.log("    🛡️  Rejector tries to withdraw. The Bank catches the error and blocks the state change...");
      await rejectorContract.connect(user).withdrawFrom(await secureBank.getAddress(), depositAmount);

      // Verificamos la contabilidad del banco
      const balanceInBank = await secureBank.balances(await rejectorContract.getAddress());
      const bankActualEtherBalance = await ethers.provider.getBalance(await secureBank.getAddress());

      // El balance se mantiene intacto porque el `require` en el banco revirtió la deducción
      expect(balanceInBank).to.equal(depositAmount);
      expect(bankActualEtherBalance).to.equal(depositAmount);
      
      console.log("    ✅ Bank internal accounting remained correct. Revert was caught successfully.");
    });
  });
});