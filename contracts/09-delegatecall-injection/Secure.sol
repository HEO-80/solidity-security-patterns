// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ProxySecure
 * @notice SECURE CONTRACT — Blinda el delegatecall a un destino de confianza
 */
contract ProxySecure {
    // Slot 0
    address public owner;
    // Slot 1
    address public trustedLogic;

    constructor(address _trustedLogic) {
        owner = msg.sender;
        trustedLogic = _trustedLogic;
    }

    // FIX 1: Restringir estrictamente quién puede modificar la lógica a ejecutar
    function upgradeLogic(address _newLogic) external {
        require(msg.sender == owner, "Acceso denegado: No eres el owner");
        trustedLogic = _newLogic;
    }

    // FIX 2: Ejecutar delegatecall SOLAMENTE contra el contrato interno de confianza,
    // eliminando el parámetro abierto _target.
    function executeDelegated(bytes memory _data) external {
        (bool success, ) = trustedLogic.delegatecall(_data);
        require(success, "Delegatecall fallo");
    }
}

/**
 * @title TrustedLogic
 * @dev La lógica oficial y segura que usa el Proxy
 */
contract TrustedLogic {
    // Mantenemos la estructura de almacenamiento en sincronía con el ProxySecure
    address public owner;
    address public trustedLogic;
    
    // Slot 2
    uint256 public someValue;

    function doSomething(uint256 _val) external {
        someValue = _val;
    }
}