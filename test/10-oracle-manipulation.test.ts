import { expect } from "chai";
import hre from "hardhat";

describe("10 - Oracle Manipulation", function () {
  let ethers: any;
  let token: any, weth: any;
  let pool: any;
  let vulnerableOptions: any, secureOptions: any;
  let mockChainlink: any;
  let deployer: any, attacker: any;

  before(async function () {
    const connection = await hre.network.getOrCreate();
    ethers = connection.ethers;
    [deployer, attacker] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // 1. Desplegamos tokens mock
    const MockToken = await ethers.getContractFactory("MockToken"); // Reutilizamos del patrón 06 o creamos uno básico
    token = await MockToken.deploy("Token", "TKN");
    weth = await MockToken.deploy("Wrapped ETH", "WETH");

    // 2. Desplegamos y fondeamos el Pool (Liquidez normal 100 TKN = 100 WETH)
    const SimplePool = await ethers.getContractFactory("contracts/10-oracle-manipulation/Vulnerable.sol:SimplePool");
    pool = await SimplePool.deploy(await token.getAddress(), await weth.getAddress());
    
    await token.mint(await pool.getAddress(), ethers.parseEther("100"));
    await weth.mint(await pool.getAddress(), ethers.parseEther("100"));

    // 3. Desplegamos el Contrato Vulnerable
    const OptionsVulnerable = await ethers.getContractFactory("contracts/10-oracle-manipulation/Vulnerable.sol:OptionsVulnerable");
    vulnerableOptions = await OptionsVulnerable.deploy(await pool.getAddress());

    // 4. Desplegamos el Oráculo Seguro y el Contrato Seguro
    const MockChainlink = await ethers.getContractFactory("contracts/10-oracle-manipulation/Secure.sol:MockChainlinkOracle");
    mockChainlink = await MockChainlink.deploy();

    const OptionsSecure = await ethers.getContractFactory("contracts/10-oracle-manipulation/Secure.sol:OptionsSecure");
    secureOptions = await OptionsSecure.deploy(await mockChainlink.getAddress());

    // Le damos mucho poder al atacante para manipular el pool
    await token.mint(attacker.address, ethers.parseEther("10000"));
  });

  describe("Exploit in Vulnerable Contract", function () {
    it("Should output a manipulated price based on pool balance distortion", async function () {
      console.log("    📊 Normal Spot Price before attack: 1 TKN = 1 WETH");
      const normalReward = await vulnerableOptions.calculateReward(ethers.parseEther("1"));
      expect(normalReward).to.equal(ethers.parseEther("1"));

      console.log("    🕵️  Attacker floods the pool with 10,000 TKN to crash the price...");
      
      // El atacante transfiere masivamente tokens al pool, diluyendo su valor instantáneo
      await token.connect(attacker).transfer(await pool.getAddress(), ethers.parseEther("10000"));

      // Calculamos la recompensa de nuevo
      const manipulatedReward = await vulnerableOptions.calculateReward(ethers.parseEther("1"));
      
      console.log(`    💀 Manipulated Reward for 1 TKN is now: ${ethers.formatEther(manipulatedReward)} WETH`);
      
      // El precio se ha desplomado debido a la inyección masiva en el denominador
      expect(manipulatedReward).to.be.lessThan(ethers.parseEther("0.01"));
    });
  });

  describe("Defense in Secure Contract", function () {
    it("Should maintain a stable price via Chainlink regardless of local pool balances", async function () {
      console.log("    🛡️  Attacker floods the pool again, but contract uses Chainlink...");
      
      // El atacante vuelve a inundar el pool
      await token.connect(attacker).transfer(await pool.getAddress(), ethers.parseEther("10000"));

      // El contrato seguro consulta Chainlink, ignorando completamente el balance del pool local
      const secureReward = await secureOptions.calculateReward(ethers.parseEther("1"));
      
      console.log(`    ✅ Secure Reward remains stable at: ${ethers.formatEther(secureReward)} WETH`);
      
      // La recompensa sigue siendo exactamente 1 WETH porque el oráculo no fue afectado
      expect(secureReward).to.equal(ethers.parseEther("1"));
    });
  });
});