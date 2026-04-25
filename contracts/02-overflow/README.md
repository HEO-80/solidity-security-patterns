<div align="center">

# 02 - Integer Overflow / Underflow

<br/>

<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"/>
<img src="https://img.shields.io/badge/Vulnerabilidad-Critica-red?style=for-the-badge"/>

<br/>

El desbordamiento y subdesbordamiento de enteros ocurre cuando el resultado de una operación aritmética excede el tamaño máximo o mínimo del tipo de dato numérico asignado, provocando que el valor "dé la vuelta" hacia el extremo opuesto del rango. En contratos inteligentes, esto altera la lógica financiera de manera inesperada, resultando en acuñación infinita de tokens, omisión de bloqueos de tiempo o robo directo de fondos.

En Solidity, los tipos de datos como `uint256` tienen un límite máximo de 2^256 - 1. Si sumas 1 a este valor máximo, el resultado vuelve a 0. De manera similar, si restas 1 a un valor de 0 en un `uint256`, ocurre un subdesbordamiento, resultando en el valor máximo posible. Antes de la versión 0.8.0, no existían verificaciones nativas para este comportamiento, requiriendo bibliotecas externas. En versiones modernas, el compilador revierte automáticamente la transacción si detecta un desbordamiento, a menos que el desarrollador utilice explícitamente un bloque `unchecked` para optimizar el gas, lo cual reintroduce la vulnerabilidad.

Piensa en ello como el cuentakilómetros mecánico de un coche antiguo. Si el cuentakilómetros tiene un máximo de 999,999 kilómetros y conduces un kilómetro más, no muestra 1,000,000; se reinicia visualmente a 000,000. Si esto controlara tu saldo bancario o el tiempo de bloqueo de tus fondos, un atacante podría forzar el reinicio a cero para sacar su dinero inmediatamente.

</div>

---

## 💥 El Ataque

El contrato `TimeLockVulnerable.sol` permite a los usuarios depositar fondos y bloquearlos durante una semana. Tiene una función `increaseLockTime` donde el desarrollador intentó ahorrar gas usando `unchecked`. 

Un atacante puede consultar su `lockTime` actual y enviar a la función un número gigantesco matemáticamente calculado para sobrepasar el límite de `uint256` (2^256 - 1). Al dar la vuelta, el `lockTime` se establece en `0`, permitiendo al atacante saltarse el bloqueo temporal y retirar los fondos en el mismo bloque.

## 🛡️ La Solución

En el contrato `TimeLockSecure.sol`, la solución es eliminar el bloque `unchecked`. En Solidity >= 0.8.0, las matemáticas están protegidas de forma nativa a nivel de compilador (SafeMath ya viene integrado). Al intentar el mismo ataque de desbordamiento, la transacción simplemente hará un `revert` con un código de pánico `0x11` (Arithmetic operation underflowed or overflowed), protegiendo la lógica del contrato.