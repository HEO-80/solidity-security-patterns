// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title RouletteVulnerable
 * @notice VULNERABLE CONTRACT — Usa block.timestamp como fuente de aleatoriedad.
 */
contract RouletteVulnerable {
    uint256 public reward = 10 ether;

    constructor() payable {
        require(msg.value == reward, "Debe fondear el contrato con 10 ETH");
    }

    // El jugador apuesta 1 ETH para adivinar si el timestamp será par (0) o impar (1)
    function spin(uint256 _guess) external payable {
        require(msg.value == 1 ether, "La apuesta es de 1 ETH");
        require(_guess == 0 || _guess == 1, "Adivina 0 (Par) o 1 (Impar)");

        // VULNERABILIDAD: Un minero puede pre-calcular esto y alterar ligeramente
        // el block.timestamp de su bloque para asegurarse de ganar siempre.
        uint256 result = block.timestamp % 2;

        if (result == _guess) {
            uint256 payout = address(this).balance;
            (bool success, ) = msg.sender.call{value: payout}("");
            require(success, "Fallo al pagar la recompensa");
        }
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}