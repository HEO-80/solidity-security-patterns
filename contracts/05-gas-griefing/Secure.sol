// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title RelayerSecure
 * @notice SECURE CONTRACT — prevents Gas Griefing
 * @dev Limita estrictamente la cantidad de gas que se envía a contratos de terceros.
 */
contract RelayerSecure {
    mapping(bytes32 => bool) public executed;

    // FIX: Requerimos que el usuario especifique un límite de gas razonable.
    function executeTransaction(bytes32 _txId, address _target, bytes memory _data, uint256 _gasLimit) external {
        require(!executed[_txId], "Transaccion ya ejecutada");

        // Comprobamos que el contrato tiene suficiente gas restante para ejecutar 
        // la llamada y también para terminar las operaciones posteriores.
        require(gasleft() >= _gasLimit + 50000, "Gas insuficiente suministrado");

        // FIX: Pasamos explícitamente un límite de gas a la llamada externa.
        // Si el contrato atacante intenta quemar gas, solo quemará el gas asignado,
        // permitiendo que el resto de la transacción principal continúe.
        (bool success, ) = _target.call{gas: _gasLimit}(_data);

        // Opcional: Podríamos emitir un evento si falla, pero el estado principal se actualiza
        if (success) {
            // Manejar éxito
        }

        // Aunque el target falle o queme su límite de gas, tenemos gas suficiente
        // para marcar la transacción como ejecutada y evitar intentos de repetición.
        executed[_txId] = true;
    }
}