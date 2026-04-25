// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TimeLockVulnerable {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public lockTime;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        // Bloquea los fondos por 1 semana
        lockTime[msg.sender] = block.timestamp + 1 weeks;
    }

    // El desarrollador usó unchecked para "ahorrar gas", ignorando la seguridad
    function increaseLockTime(uint256 _secondsToIncrease) external {
        unchecked {
            lockTime[msg.sender] += _secondsToIncrease;
        }
    }

    function withdraw() external {
        require(balances[msg.sender] > 0, "No tienes fondos");
        require(block.timestamp > lockTime[msg.sender], "El tiempo de bloqueo no ha expirado");

        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Fallo al enviar Ether");
    }
}