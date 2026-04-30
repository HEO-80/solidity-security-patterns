// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IBank {
    function deposit() external payable;
    function withdraw(uint256 _amount) external;
}

/**
 * @title SecureBank
 * @notice SECURE CONTRACT — Comprueba estrictamente todos los valores de retorno.
 */
contract SecureBank is IBank {
    mapping(address => uint256) public balances;

    function deposit() external payable override {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) external override {
        require(balances[msg.sender] >= _amount, "Saldo insuficiente");
        
        // FIX: Se captura el booleano 'success' y se exige que sea true.
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Fallo al enviar Ether");
        
        balances[msg.sender] -= _amount;
    }
}