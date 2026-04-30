<div align="center">

<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"/>
<img src="https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white"/>
<img src="https://img.shields.io/badge/Vulnerabilidad-Alta-orange?style=for-the-badge"/>

<br/>

# 04 - Front-Running

El ataque de front-running ocurre cuando un actor malicioso observa una transacción pendiente en la *mempool* pública de la red y envía su propia transacción idéntica, pero con una tarifa de gas (gas price) más alta. Al pagar más comisiones, los mineros o validadores priorizan la transacción del atacante incluyéndola en el bloque antes que la transacción original de la víctima. Esto permite al atacante anticiparse a la acción de la víctima para su propio beneficio económico, como reclamar una recompensa, ejecutar un arbitraje o comprar tokens antes de una transacción grande.

Para ilustrar este concepto, imagina que descubres la respuesta de un concurso de radio y envías una carta con la solución. En la oficina de correos, alguien lee tu carta por encima de tu hombro, descubre la respuesta, y decide pagar un servicio de mensajería urgente. Su carta llega a la radio antes que la tuya, y él se lleva el premio usando tu descubrimiento.

---

## 💥 El Ataque

En el contrato `FindThisHash.sol` (versión vulnerable), el sistema ofrece una recompensa de 10 ETH a la primera persona que llame a la función `solve()` enviando un `string` cuyo hash coincida con el objetivo (targetHash).

Si un usuario legítimo descubre que la solución es "Ethereum" y envía la transacción `solve("Ethereum")`, los datos de esa transacción viajan en texto plano a la mempool esperando ser minados. Un bot de front-running puede escanear la mempool, identificar que se está llamando a `solve` con la respuesta correcta, y emitir exactamente la misma transacción pagando más gas. La red procesa primero la transacción del bot atacante, le transfiere los 10 ETH, y cuando la transacción del usuario legítimo finalmente se ejecuta, la recompensa ya no está.

## 🛡️ La Solución

En el contrato `CommitReveal.sol` (versión segura), se neutraliza esta amenaza implementando el patrón criptográfico **Commit-Reveal**, el cual divide la ejecución en dos fases estrictas para ocultar los datos:

1. **Fase de Commit (Compromiso):** El usuario no envía la respuesta al contrato. En su lugar, envía un hash que combina su solución, una clave secreta arbitraria (*salt*) y su propia dirección (`keccak256(solución + salt + msg.sender)`). Esto asegura su derecho sobre la respuesta sin revelarla en la mempool. Si el atacante copia este hash, no le sirve de nada porque desconoce la respuesta subyacente y, además, el hash está vinculado criptográficamente a la billetera de la víctima.
2. **Fase de Reveal (Revelación):** Una vez que la transacción del *commit* ha sido consolidada en un bloque anterior, el usuario llama a `reveal()` pasando su solución y el *salt* en texto plano. El contrato recalcula el hash y verifica que coincida con el *commit* original guardado en el paso anterior. 

Al forzar este retraso de al menos un bloque entre el compromiso y la revelación de la información, el atacante no tiene tiempo ni visibilidad en la mempool para robar y enviar la respuesta en el mismo instante, bloqueando el front-running por completo.

</div>