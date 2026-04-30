import { expect } from "chai";
import hre from "hardhat";

describe("08 - Timestamp Dependence", function () {
  let ethers: any;
  let vulnerableRoulette: any, secureRoulette: any;
  let mockVRF: any;
  let deployer: any, maliciousMiner: any;

  before(async function () {
    const connection = await hre.network.getOrCreate();
    ethers = connection.ethers;
    [deployer, maliciousMiner] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // 1. Desplegar Ruleta Vulnerable con 10 ETH de premio
    const VulnerableRoulette = await ethers.getContractFactory("contracts/08-timestamp-dependence/Vulnerable.sol:RouletteVulnerable");
    vulnerableRoulette = await VulnerableRoulette.deploy({ value: ethers.parseEther("10") });

    // 2. Desplegar el Mock VRF Coordinator
    const MockVRFCoordinator = await ethers.getContractFactory("contracts/08-timestamp-dependence/Secure.sol:MockVRFCoordinator");
    mockVRF = await MockVRFCoordinator.deploy();

    // 3. Desplegar Ruleta Segura con 10 ETH de premio
    const SecureRoulette = await ethers.getContractFactory("contracts/08-timestamp-dependence/Secure.sol:RouletteSecure");
    secureRoulette = await SecureRoulette.deploy(await mockVRF.getAddress(), { value: ethers.parseEther("10") });
    await mockVRF.setRoulette(await secureRoulette.getAddress());
  });

  describe("Exploit in Vulnerable Contract", function () {
    it("Should allow a malicious miner to manipulate the timestamp and win", async function () {
      console.log("    🕵️  Malicious Miner analyzes the current block timestamp...");
      
      // Simulamos la manipulación del minero: Fuerza que el próximo timestamp sea PAR
      const currentBlock = await ethers.provider.getBlock("latest");
      const nextParTimestamp = currentBlock.timestamp + (currentBlock.timestamp % 2 === 0 ? 2 : 1);
      
      await ethers.provider.send("evm_setNextBlockTimestamp", [nextParTimestamp]);

      // El minero apuesta 1 ETH a que saldrá PAR (0)
      const guess = 0;
      await vulnerableRoulette.connect(maliciousMiner).spin(guess, { value: ethers.parseEther("1") });

      const contractBalance = await vulnerableRoulette.getBalance();
      
      // Si el balance es 0, el minero vació el contrato porque adivinó correctamente
      expect(contractBalance).to.equal(0n);
      console.log("    💀 Miner forced a PAR timestamp, won the bet, and drained the 11 ETH pot!");
    });
  });

  describe("Defense in Secure Contract", function () {
    it("Should rely on VRF Oracle, preventing timestamp manipulation", async function () {
      console.log("    🛡️  Miner tries to manipulate timestamp again...");
      
      // El minero intenta la misma manipulación: Forzar timestamp PAR
      const currentBlock = await ethers.provider.getBlock("latest");
      const nextParTimestamp = currentBlock.timestamp + (currentBlock.timestamp % 2 === 0 ? 2 : 1);
      await ethers.provider.send("evm_setNextBlockTimestamp", [nextParTimestamp]);

      // El minero apuesta a PAR (0) creyendo que va a ganar
      const guess = 0;
      console.log("    🎲 Miner bets on PAR (0) and requests random words...");
      const tx = await secureRoulette.connect(maliciousMiner).spin(guess, { value: ethers.parseEther("1") });
      const receipt = await tx.wait();

      // Verificamos que el balance no ha sido vaciado (El juego sigue pendiente)
      let contractBalance = await secureRoulette.getBalance();
      expect(contractBalance).to.equal(ethers.parseEther("11"));

      // El oráculo responde de forma asíncrona con un número verdaderamente aleatorio (ej. 777, que es impar)
      const fakeRequestId = 1;
      const trueRandomWord = 777; 
      
      console.log(`    📡 VRF Oracle responds with true random word: ${trueRandomWord} (IMPAR)`);
      await mockVRF.fulfillRandomness(fakeRequestId, trueRandomWord);

      // Verificamos el balance final. El minero perdió su apuesta porque el oráculo devolvió IMPAR.
      contractBalance = await secureRoulette.getBalance();
      expect(contractBalance).to.equal(ethers.parseEther("11")); // Los fondos originales + el ETH de la apuesta perdida

      console.log("    ✅ The bet failed. VRF Oracle defeated the timestamp manipulation.");
    });
  });
});