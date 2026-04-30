// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IBank {
    function deposit() external payable;
    function withdraw(uint256 _amount) external;
}

/**
 * @title VulnerableBank
 * @notice VULNERABLE CONTRACT — No comprueba el resultado de una llamada de bajo nivel.
 */
contract VulnerableBank is IBank {
    mapping(address => uint256) public balances;

    function deposit() external payable override {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) external override {
        require(balances[msg.sender] >= _amount, "Saldo insuficiente");
        
        // VULNERABILIDAD: No se captura el valor booleano de retorno.
        msg.sender.call{value: _amount}("");
        
        balances[msg.sender] -= _amount;
    }
}

/**
 * @title Rejector
 * @dev Contrato que interactúa con el banco pero revierte al recibir Ether.
 */
contract Rejector {
    receive() external payable {
        revert("Rechazo cualquier intento de enviarme Ether");
    }

    function depositTo(address _bank) external payable {
        IBank(_bank).deposit{value: msg.value}();
    }

    function withdrawFrom(address _bank, uint256 _amount) external {
        // Usamos try/catch nativo de Solidity.
        // Si el banco seguro revierte la transacción, el catch lo atrapa
        // evitando que el test de Hardhat explote por completo.
        try IBank(_bank).withdraw(_amount) {
        } catch {
        }
    }
}