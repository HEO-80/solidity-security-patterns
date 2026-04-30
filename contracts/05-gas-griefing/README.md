<div align="center">

<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"/>
<img src="https://img.shields.io/badge/EIP--150-4e5ee4?style=for-the-badge&logo=ethereum&logoColor=white"/>
<img src="https://img.shields.io/badge/Vulnerabilidad-Alta-orange?style=for-the-badge"/>

<br/>

# 05 - Gas Griefing (Agotamiento de Gas)

El *Gas Griefing* ocurre cuando un contrato inteligente realiza una llamada externa a una dirección de terceros sin limitar la cantidad de gas enviada, y el contrato receptor consume deliberadamente todo ese gas. Debido a las reglas de la Máquina Virtual de Ethereum (específicamente la regla de 63/64 introducida en la EIP-150), la llamada principal retiene una pequeña fracción del gas cuando la sub-llamada falla. Sin embargo, si esa pequeña fracción no es suficiente para que el contrato principal termine de procesar su propia lógica (como actualizar variables de estado o emitir eventos), toda la transacción revierte por falta de gas (*Out of Gas*).

Esto afecta de manera crítica a los contratos que actúan como *Relayers* (retransmisores de meta-transacciones), procesadores de pagos por lotes, o cualquier protocolo que ejecute código arbitrario de los usuarios. El emisor de la transacción termina pagando altas comisiones a los validadores de la red, pero no logra realizar ningún cambio en la blockchain, sufriendo pérdidas económicas y bloqueando posibles flujos operativos.

Para entender este concepto, imagina que eres un administrador de un edificio que contrata a un servicio de mensajería (el Relayer) para enviar paquetes a los inquilinos. Si le das al mensajero dinero ilimitado para el taxi y no especificas una tarifa máxima, un inquilino malicioso podría redirigir al taxista para que conduzca en círculos todo el día. El mensajero gastará todo el dinero asignado y, al final del día, no tendrá saldo ni siquiera para volver a la oficina y registrar que el paquete no pudo ser entregado.

---

## 💥 El Ataque

En el contrato `RelayerVulnerable.sol`, el sistema expone una función `executeTransaction` que toma un contrato objetivo (`target`) y lo ejecuta enviándole toda la cantidad de gas remanente en la transacción.

Si un atacante proporciona un contrato objetivo diseñado con una función *fallback* que contiene un bucle infinito (`while(true){}`), este consumirá absolutamente todo el gas. Como resultado, la llamada falla devolviendo un valor booleano `false`, y la ejecución vuelve al `Relayer`. Sin embargo, debido al agotamiento casi total, el `Relayer` no tiene suficiente gas residual para actualizar su propio mapeo `executed[_txId] = true`. Toda la transacción colapsa, el retransmisor asume el costo económico, y el estado de la transacción nunca se marca como completado, abriendo la puerta a bucles de denegación de servicio (DoS).

## 🛡️ La Solución

En el contrato `RelayerSecure.sol`, se neutraliza este ataque imponiendo límites estrictos y calculados al consumo de gas de los contratos externos:

1. Se introduce el parámetro `_gasLimit` exigiendo que el usuario declare exactamente cuánto gas requiere su llamada.
2. Antes de realizar la llamada, el contrato utiliza `gasleft()` para verificar matemáticamente que el gas actual es suficiente para cubrir la llamada externa **y** reservar un remanente seguro (ej. 50,000 unidades) para la lógica interna posterior.
3. Se modifica la llamada externa acotando el gas: `_target.call{gas: _gasLimit}(_data)`. 

Al hacer esto, el contrato atacante puede entrar en un bucle infinito, pero el motor de Ethereum cortará su ejecución en el momento en que consuma el `_gasLimit`. El control volverá inmediatamente al contrato `RelayerSecure`, el cual aún dispondrá de las 50,000 unidades de gas reservadas para actualizar con éxito el estado `executed[_txId] = true` y culminar la transacción.

</div>