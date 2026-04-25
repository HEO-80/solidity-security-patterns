// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VaultVulnerable {
    address public owner;
    mapping(address => uint256) public balances;

    constructor() {
        owner = msg.sender;
    }

    // Los usuarios pueden depositar fondos en la bóveda
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // VULNERABILIDAD: ¡No hay control de acceso!
    // Cualquiera puede llamar a esta función y vaciar el contrato entero
    function emergencyWithdrawAll() external {
        uint256 totalBalance = address(this).balance;
        require(totalBalance > 0, "No hay fondos para retirar");

        // Envía todo el balance al que llama la función (msg.sender)
        (bool sent, ) = msg.sender.call{value: totalBalance}("");
        require(sent, "Fallo al enviar Ether");
    }
}