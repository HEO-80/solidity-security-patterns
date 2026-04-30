// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title VulnerableBank
 * @notice VULNERABLE CONTRACT — No comprueba el resultado de una llamada de bajo nivel.
 */
contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) external {
        require(balances[msg.sender] >= _amount, "Saldo insuficiente");
        
        // VULNERABILIDAD: No se captura ni se comprueba el valor de retorno (booleano).
        // Si el destinatario es un contrato que no puede recibir Ether, 
        // la transferencia fallará silenciosamente.
        msg.sender.call{value: _amount}("");
        
        // Se descuenta el balance asumiendo que el envío fue un éxito.
        balances[msg.sender] -= _amount;
    }
}

/**
 * @title Rejector
 * @dev Un contrato de usuario que interactúa con el banco pero no acepta Ether de vuelta.
 */
contract Rejector {
    // Al intentar enviar Ether a este contrato, la transacción fallará.
    receive() external payable {
        revert("Rechazo cualquier intento de enviarme Ether");
    }

    // Funciones de conveniencia para interactuar en los tests
    function depositTo(address _bank) external payable {
        (bool success, ) = _bank.call{value: msg.value}(abi.encodeWithSignature("deposit()"));
        require(success, "Fallo al depositar");
    }

    function withdrawFrom(address _bank, uint256 _amount) external {
        // Hacemos la llamada asumiendo que nosotros fallaremos al recibir
        _bank.call(abi.encodeWithSignature("withdraw(uint256)", _amount));
    }
}