<div align="center">

<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"/>
<img src="https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white"/>
<img src="https://img.shields.io/badge/Vulnerabilidad-Alta-orange?style=for-the-badge"/>

<br/>

# 07 - Unchecked Return Values (Valores de Retorno No Verificados)

En Solidity, cuando interactúas con otros contratos utilizando llamadas de bajo nivel como `.call()`, `.send()` o `.delegatecall()`, la Máquina Virtual de Ethereum (EVM) no detiene la transacción automáticamente si el contrato receptor falla o revierte. En su lugar, estas funciones simplemente devuelven un valor booleano (`false`) indicando que algo salió mal.

Si un desarrollador no envuelve esa llamada en un `require()` para verificar que el resultado fue `true`, el contrato continuará ejecutando las líneas de código siguientes. Esto genera graves desajustes en la contabilidad interna: se pueden actualizar balances, emitir eventos o cambiar roles asumiendo erróneamente que una transferencia de fondos se realizó con éxito.

---

## 💥 El Ataque

En el contrato `VulnerableBank.sol`, los usuarios pueden depositar y retirar sus ahorros. La función `withdraw()` envía el Ether solicitado de vuelta al usuario usando `msg.sender.call{value: _amount}("")`, y en la línea siguiente, deduce ese monto del balance del usuario (`balances[msg.sender] -= _amount`).

Imagina que un usuario interactúa a través de un contrato inteligente (`Rejector`) que no tiene una función para recibir Ether, o cuya función `receive()` lanza un error intencionalmente. 
1. El `Rejector` pide retirar su dinero.
2. El banco intenta enviarle el Ether. La transferencia falla porque el `Rejector` no la acepta.
3. Como el banco no comprueba si el envío fue exitoso, ignora el fallo silencioso.
4. El banco ejecuta la siguiente línea de código y resta el balance de la cuenta del `Rejector`.
5. **Resultado:** El Ether se queda atrapado en el banco, pero el sistema contable dice que el usuario ya lo retiró. El usuario pierde todos sus fondos irrevocablemente.

## 🛡️ La Solución

En el contrato `SecureBank.sol`, se captura la variable booleana que devuelve la llamada de bajo nivel y se evalúa estrictamente. 

Se implementa el bloque:
`(bool success, ) = msg.sender.call{value: _amount}("");`
`require(success, "Fallo al enviar Ether");`

Con esta simple línea de protección, si la transferencia falla por cualquier motivo, el `require` detiene la ejecución, revierte toda la transacción y restaura el estado original. De este modo, los balances del libro contable nunca se actualizarán a menos que el dinero haya llegado realmente a su destino.

</div>