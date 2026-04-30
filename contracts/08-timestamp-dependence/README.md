<div align="center">

<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"/>
<img src="https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white"/>
<img src="https://img.shields.io/badge/Vulnerabilidad-Media-yellow?style=for-the-badge"/>

<br/>

# 08 - Timestamp Dependence (Dependencia de Marcas de Tiempo)

En la EVM (Ethereum Virtual Machine), la variable `block.timestamp` representa el momento en que se minó el bloque. Sin embargo, este valor no es absolutamente preciso ni está garantizado criptográficamente; los validadores de la red tienen un pequeño margen de manipulación (generalmente unos pocos segundos) para ajustar esta marca de tiempo al proponer un nuevo bloque.

La vulnerabilidad ocurre cuando un contrato inteligente utiliza `block.timestamp` como semilla principal para generar números "aleatorios" en funciones críticas (como determinar el ganador de una lotería, asignar un NFT raro o calcular recompensas). Si hay suficiente incentivo económico, un validador malicioso podría publicar un bloque con un timestamp ligeramente alterado que garantice su propia victoria en el contrato inteligente.

---

## 💥 El Ataque

En el contrato `RouletteVulnerable.sol`, los usuarios apuestan Ether para adivinar si el `block.timestamp` actual será par o impar. La función `spin()` calcula el resultado simplemente comprobando si el resto de dividir `block.timestamp` entre 2 es cero (`block.timestamp % 2 == 0`).

Si un validador malicioso quiere jugar a esta ruleta y apuesta a que saldrá par, pero el reloj real dicta que el timestamp será impar (por ejemplo, `1700000001`), el validador simplemente ajusta el timestamp de su bloque propuesto a `1700000002`. La red acepta esta pequeña desviación, el bloque se mina, y el validador gana la ruleta manipulando el resultado a su favor de forma indetectable.

## 🛡️ La Solución

En el contrato `RouletteSecure.sol`, se elimina por completo la dependencia de variables internas predecibles o manipulables para generar aleatoriedad.

La única solución robusta y estándar en la industria para obtener números aleatorios seguros (RNG) en cadenas de bloques EVM es utilizar un **Oráculo de Funciones Aleatorias Verificables (VRF)**, como Chainlink VRF. 

El contrato seguro solicita un número aleatorio a un coordinador off-chain. Este coordinador genera el número y una prueba criptográfica que certifica que el número no fue alterado. Luego, el oráculo llama de vuelta al contrato inteligente (`fulfillRandomWords`) inyectando la verdadera aleatoriedad, la cual es matemáticamente imposible de predecir o manipular por los mineros o los usuarios.

*(Nota: En este repositorio usamos un "Mock" de VRF para poder testear el patrón localmente sin depender de la red real de Chainlink).*

</div>