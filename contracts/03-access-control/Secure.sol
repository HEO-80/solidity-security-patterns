// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VaultSecure {
    address public owner;
    mapping(address => uint256) public balances;

    // FIX 1: Creamos un modificador de control de acceso
    modifier onlyOwner() {
        require(msg.sender == owner, "Acceso denegado: No eres el owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // FIX 2: Aplicamos el modificador a la función crítica
    function emergencyWithdrawAll() external onlyOwner {
        uint256 totalBalance = address(this).balance;
        require(totalBalance > 0, "No hay fondos para retirar");

        // FIX 3: Por seguridad adicional, enviamos al 'owner' explícitamente
        (bool sent, ) = owner.call{value: totalBalance}("");
        require(sent, "Fallo al enviar Ether");
    }
}