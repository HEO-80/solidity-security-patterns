// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title SecureBank
 * @notice SECURE CONTRACT — Comprueba estrictamente todos los valores de retorno.
 */
contract SecureBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) external {
        require(balances[msg.sender] >= _amount, "Saldo insuficiente");
        
        // FIX: Se captura el booleano 'success' y se exige que sea true.
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Fallo al enviar Ether: El destinatario lo rechazo");
        
        // Si falló, la ejecución nunca llega aquí porque el require revierte la tx.
        balances[msg.sender] -= _amount;
    }
}