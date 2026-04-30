import { expect } from "chai";
import hre from "hardhat";

describe("06 - Flash Loan Attack (Oracle Manipulation)", function () {
  let ethers: any;
  let tokenA: any, tokenB: any;
  let dex: any, pool: any;
  let vulnerableLending: any, attacker: any;
  let secureLending: any, mockOracle: any;
  let deployer: any, hacker: any;

  before(async function () {
    const connection = await hre.network.getOrCreate();
    ethers = connection.ethers;
    [deployer, hacker] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // 1. Desplegamos los Tokens
    const MockToken = await ethers.getContractFactory("MockToken");
    tokenA = await MockToken.deploy("Token A", "TKNA");
    tokenB = await MockToken.deploy("Token B", "TKNB");

    await tokenA.mint(deployer.address, ethers.parseEther("100000"));
    await tokenB.mint(deployer.address, ethers.parseEther("100000"));

    // 2. Desplegamos el DEX y le damos liquidez inicial balanceada (1000 A y 1000 B)
    // Precio inicial: 1 TokenA = 1 TokenB
    const SimpleDEX = await ethers.getContractFactory("SimpleDEX");
    dex = await SimpleDEX.deploy(await tokenA.getAddress(), await tokenB.getAddress());
    await tokenA.approve(await dex.getAddress(), ethers.parseEther("1000"));
    await tokenB.approve(await dex.getAddress(), ethers.parseEther("1000"));
    await dex.addLiquidity(ethers.parseEther("1000"), ethers.parseEther("1000"));

    // 3. Desplegamos la piscina de Flash Loans con 10,000 TokenB disponibles
    const FlashLoanPool = await ethers.getContractFactory("FlashLoanPool");
    pool = await FlashLoanPool.deploy(await tokenB.getAddress());
    await tokenB.transfer(await pool.getAddress(), ethers.parseEther("10000"));

    // 4. Desplegamos el protocolo de Lending Vulnerable con 10,000 TokenB en caja
    const VulnerableLending = await ethers.getContractFactory("VulnerableLending");
    vulnerableLending = await VulnerableLending.deploy(
      await dex.getAddress(),
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );
    await tokenB.transfer(await vulnerableLending.getAddress(), ethers.parseEther("10000"));

    // 5. Desplegamos el protocolo de Lending Seguro y su Oráculo
    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracle.deploy();

    const SecureLending = await ethers.getContractFactory("SecureLending");
    secureLending = await SecureLending.deploy(
      await mockOracle.getAddress(),
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );
    await tokenB.transfer(await secureLending.getAddress(), ethers.parseEther("10000"));

    // 6. Desplegamos el contrato del Atacante
    const Attacker = await ethers.getContractFactory("FlashLoanAttacker");
    attacker = await Attacker.deploy(
      await pool.getAddress(),
      await dex.getAddress(),
      await vulnerableLending.getAddress(),
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );
  });

  describe("Exploit in Vulnerable Contract", function () {
    it("Should drain the Lending Protocol by manipulating the DEX price via Flash Loan", async function () {
      expect(await tokenB.balanceOf(hacker.address)).to.equal(0n);

      console.log("    🕵️  Attacker initiates Flash Loan of 9,000 TokenB...");
      console.log("    💥 Manipulating DEX price and draining Vulnerable Lending...");
      
      // ¡BUM! Se ejecuta el ataque
      await attacker.connect(hacker).attack();

      const hackerBalance = await tokenB.balanceOf(hacker.address);
      const lendingBalance = await tokenB.balanceOf(await vulnerableLending.getAddress());

      console.log(`    💰 Hacker profit: ${ethers.formatEther(hackerBalance)} TokenB`);
      console.log(`    💀 Lending Protocol Balance: ${ethers.formatEther(lendingBalance)} TokenB`);

      expect(hackerBalance).to.be.greaterThan(0n);
      expect(lendingBalance).to.equal(0n); // El protocolo ha sido drenado a CERO
    });
  });

  describe("Defense in Secure Contract", function () {
    it("Should block the attack because price is fetched from a secure Oracle", async function () {
      // Le damos al hacker el colateral que habría conseguido manipulando el DEX (900 TokenA)
      const manipulatedCollateral = ethers.parseEther("900"); 
      await tokenA.mint(hacker.address, manipulatedCollateral);
      await tokenA.connect(hacker).approve(await secureLending.getAddress(), manipulatedCollateral);
      
      const greedyBorrowAmount = ethers.parseEther("10000");

      console.log("    🛡️  Attacker tries to use 900 TokenA to borrow 10,000 TokenB from Secure Protocol...");
      
      try {
        await secureLending.connect(hacker).borrow(greedyBorrowAmount, manipulatedCollateral);
        expect.fail("Transaction should have reverted");
      } catch (error: any) {
        expect(error.message.toLowerCase()).to.include("colateral insuficiente");
      }

      const lendingBalance = await tokenB.balanceOf(await secureLending.getAddress());
      expect(lendingBalance).to.equal(ethers.parseEther("10000")); // Ni un centavo perdido
      console.log("    ✅ Secure Protocol remained safe. Fake DEX prices rejected.");
    });
  });
});