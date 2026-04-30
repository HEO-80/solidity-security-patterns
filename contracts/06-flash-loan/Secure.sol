// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockOracle
 * @dev Simula un Chainlink Price Feed que reporta precios seguros fuera de la cadena
 */
contract MockOracle {
    // Simulamos un precio consolidado y seguro (1 TokenA = 1 TokenB siempre)
    uint256 public constant FIXED_PRICE = 1e18; 

    function getPriceOfA() external pure returns (uint256) { 
        return FIXED_PRICE; 
    }
}

/**
 * @title SecureLending
 * @notice SECURE CONTRACT — Utiliza un Oráculo en lugar del balance de un DEX
 */
contract SecureLending {
    MockOracle public oracle;
    ERC20 public tokenA;
    ERC20 public tokenB;

    constructor(address _oracle, address _tA, address _tB) {
        oracle = MockOracle(_oracle);
        tokenA = ERC20(_tA);
        tokenB = ERC20(_tB);
    }

    function borrow(uint256 _borrowAmount, uint256 _collateralAmount) external {
        // FIX: Solicitamos el precio a una fuente externa, segura e inmutable en este bloque
        uint256 priceA = oracle.getPriceOfA();
        
        uint256 collateralValue = (_collateralAmount * priceA) / 1e18;
        require(collateralValue >= _borrowAmount, "Colateral insuficiente");

        tokenA.transferFrom(msg.sender, address(this), _collateralAmount);
        tokenB.transfer(msg.sender, _borrowAmount);
    }
}