import { expect } from "chai";
import hre from "hardhat";

describe("05 - Gas Griefing Attack", function () {
  // Solución a las líneas rojas: Le decimos a TypeScript que estas variables son de tipo 'any'
  let ethers: any;
  let Vulnerable: any, vulnerableContract: any;
  let Secure: any, secureContract: any;
  let Burner: any, burnerContract: any;
  let relayer: any, user: any, attacker: any;

  before(async function () {
    const connection = await hre.network.getOrCreate();
    ethers = connection.ethers;
    [relayer, user, attacker] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy Vulnerable version
    Vulnerable = await ethers.getContractFactory("RelayerVulnerable");
    vulnerableContract = await Vulnerable.deploy();

    // Deploy Secure version
    Secure = await ethers.getContractFactory("RelayerSecure");
    secureContract = await Secure.deploy();

    // Deploy Attacker (Gas Burner)
    Burner = await ethers.getContractFactory("GasBurner");
    burnerContract = await Burner.deploy();
  });

  describe("Exploit in Vulnerable Contract", function () {
    it("Should fail completely when the target consumes all gas (Out of Gas)", async function () {
      const txId = ethers.encodeBytes32String("tx-vulnerable-1");
      const maliciousData = "0x"; 

      console.log("    🕵️  Attacker submits a transaction pointing to the GasBurner...");
      
      try {
        await vulnerableContract.connect(relayer).executeTransaction(
            txId, 
            await burnerContract.getAddress(), 
            maliciousData,
            { gasLimit: 5000000 }
        );
        expect.fail("Transaction should have failed due to Out of Gas");
      } catch (error: any) {
        // CORRECCIÓN: Buscamos "vm exception" que es exactamente lo que Hardhat está devolviendo
        expect(error.message.toLowerCase()).to.include("vm exception");
      }

      const isExecuted = await vulnerableContract.executed(txId);
      expect(isExecuted).to.be.false;
      console.log("    💀 Relayer burned their gas fee, but the transaction state was never updated!");
    });
  });

  describe("Defense in Secure Contract", function () {
    it("Should isolate the external failure and complete the main transaction", async function () {
      const txId = ethers.encodeBytes32String("tx-secure-1");
      const maliciousData = "0x";
      const SAFE_GAS_LIMIT = 100000;
      
      console.log("    🛡️  Relayer executes the transaction but sets a strict gas limit...");

      await secureContract.connect(relayer).executeTransaction(
          txId, 
          await burnerContract.getAddress(), 
          maliciousData,
          SAFE_GAS_LIMIT,
          { gasLimit: 5000000 }
      );

      const isExecuted = await secureContract.executed(txId);
      expect(isExecuted).to.be.true;
      console.log("    ✅ External call failed securely. Relayer state updated without crashing.");
    });
  });
});