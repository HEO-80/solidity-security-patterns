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
    const VulnerableBank = await ethers.getContractFactory("contracts/07-unchecked-return/Vulnerable.sol:VulnerableBank");
    vulnerableBank = await VulnerableBank.deploy();

    const SecureBank = await ethers.getContractFactory("contracts/07-unchecked-return/Secure.sol:SecureBank");
    secureBank = await SecureBank.deploy();

    const Rejector = await ethers.getContractFactory("contracts/07-unchecked-return/Vulnerable.sol:Rejector");
    rejectorContract = await Rejector.deploy();
  });

  describe("Exploit in Vulnerable Contract", function () {
    it("Should deduct balance even if the Ether transfer fails", async function () {
      const depositAmount = ethers.parseEther("1");

      const tx1 = await rejectorContract.connect(user).depositTo(await vulnerableBank.getAddress(), { value: depositAmount });
      await tx1.wait(); // Asegura la actualización de estado
      
      let balanceInBank = await vulnerableBank.balances(await rejectorContract.getAddress());
      expect(balanceInBank).to.equal(depositAmount);
      console.log("    🏦 Rejector deposited 1 ETH into Vulnerable Bank.");

      console.log("    🕵️  Rejector tries to withdraw. The Ether transfer fails, but the Bank ignores it...");
      const tx2 = await rejectorContract.connect(user).withdrawFrom(await vulnerableBank.getAddress(), depositAmount);
      await tx2.wait(); // Asegura la actualización de estado

      balanceInBank = await vulnerableBank.balances(await rejectorContract.getAddress());
      const bankActualEtherBalance = await ethers.provider.getBalance(await vulnerableBank.getAddress());

      expect(balanceInBank).to.equal(0n);
      expect(bankActualEtherBalance).to.equal(depositAmount);
      
      console.log("    💀 Rejector's balance was updated to 0, but they never received the ETH. Funds lost!");
    });
  });

  describe("Defense in Secure Contract", function () {
    it("Should revert the whole transaction if the Ether transfer fails", async function () {
      const depositAmount = ethers.parseEther("1");

      const tx1 = await rejectorContract.connect(user).depositTo(await secureBank.getAddress(), { value: depositAmount });
      await tx1.wait();
      console.log("    🏦 Rejector deposited 1 ETH into Secure Bank.");

      console.log("    🛡️  Rejector tries to withdraw. The Bank catches the error and blocks the state change...");
      const tx2 = await rejectorContract.connect(user).withdrawFrom(await secureBank.getAddress(), depositAmount);
      await tx2.wait();

      const balanceInBank = await secureBank.balances(await rejectorContract.getAddress());
      const bankActualEtherBalance = await ethers.provider.getBalance(await secureBank.getAddress());

      expect(balanceInBank).to.equal(depositAmount);
      expect(bankActualEtherBalance).to.equal(depositAmount);
      
      console.log("    ✅ Bank internal accounting remained correct. Revert was caught successfully.");
    });
  });
});