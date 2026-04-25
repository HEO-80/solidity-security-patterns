// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract TimeLockSecure {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public lockTime;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        lockTime[msg.sender] = block.timestamp + 1 weeks;
    }

    // FIX: Confiar en las comprobaciones nativas de Solidity 0.8+
    // Si la suma supera el máximo de uint256, la transacción se revertirá automáticamente
    function increaseLockTime(uint256 _secondsToIncrease) external {
        lockTime[msg.sender] += _secondsToIncrease;
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