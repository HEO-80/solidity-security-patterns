// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title RelayerVulnerable
 * @notice VULNERABLE CONTRACT — demonstrates Gas Griefing
 * @dev Un contrato que ejecuta transacciones en nombre de otros (Relayer).
 *      No limita el gas enviado en la llamada externa.
 */
contract RelayerVulnerable {
    mapping(bytes32 => bool) public executed;

    // VULNERABILIDAD: Se reenvía casi todo el gas disponible (63/64 partes).
    function executeTransaction(bytes32 _txId, address _target, bytes memory _data) external {
        require(!executed[_txId], "Transaccion ya ejecutada");

        // Realizamos la llamada externa sin limite de gas
        (bool success, ) = _target.call(_data);
        
        // Si el objetivo consume todo el gas, la transacción original se quedará 
        // con solo 1/64 del gas (EIP-150). Si ese 1/64 no es suficiente para
        // ejecutar la siguiente línea de código, TODA la transacción falla por 
        // "Out of Gas", y el Relayer paga la comisión a los mineros sin éxito.
        require(success, "Llamada externa fallo");

        executed[_txId] = true;
    }
}

/**
 * @title GasBurner
 * @notice Contrato atacante utilizado en los tests
 */
contract GasBurner {
    // Al recibir cualquier llamada, entra en un bucle infinito para quemar el gas
    fallback() external {
        while (true) {}
    }
}