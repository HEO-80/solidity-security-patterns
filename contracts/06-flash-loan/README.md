<div align="center">

<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"/>
<img src="https://img.shields.io/badge/DeFi-4e5ee4?style=for-the-badge&logo=ethereum&logoColor=white"/>
<img src="https://img.shields.io/badge/Vulnerabilidad-Critica-red?style=for-the-badge"/>

<br/>

# 06 - Flash Loan Attack (Manipulación de Oráculo)

Un **Flash Loan** (Préstamo Relámpago) permite a un usuario pedir prestada una cantidad virtualmente infinita de activos sin proporcionar ninguna garantía (colateral), bajo una única condición: el préstamo completo, más una pequeña comisión, debe ser devuelto en la **misma transacción**. Si no se devuelve, la transacción entera revierte como si nada hubiera pasado.

Aunque los Flash Loans son herramientas legítimas para arbitraje y liquidaciones, en manos de un atacante son un arma de destrucción masiva. Permiten a cualquier persona, sin importar su capital real, convertirse en una "ballena" por unos segundos y romper la lógica matemática de otros protocolos. 

Uno de los vectores más comunes es la **Manipulación de Oráculos de Precios (Spot Price Manipulation)**.

---

## 💥 El Ataque

En este escenario, tenemos tres actores:
1. **Un DEX Simple (Automated Market Maker):** Determina el precio de un token basándose puramente en su balance actual de reservas (`Reserva B / Reserva A`).
2. **Un Protocolo de Lending (Vulnerable):** Permite a los usuarios dejar `TokenA` como garantía para pedir prestado `TokenB`. Para saber cuánto vale el `TokenA`, le pregunta al DEX su precio actual (Spot Price).
3. **El Pool de Flash Loans:** Tiene millones en liquidez disponibles para prestar.

El **Atacante** ejecuta el siguiente flujo en una sola transacción:
1. Pide un **Flash Loan** masivo de 9,000 `TokenB`.
2. Va al DEX e intercambia los 9,000 `TokenB` por `TokenA`. Esto inunda el DEX de `TokenB` y vacía sus reservas de `TokenA`. Como resultado, el algoritmo del DEX dispara el precio del `TokenA` hasta las nubes.
3. El atacante va al Protocolo de Lending. Deposita una cantidad minúscula de `TokenA`. El protocolo de Lending le pregunta al DEX el precio, y el DEX (manipulado) responde que el `TokenA` vale una fortuna.
4. Con ese falso poder adquisitivo, el atacante pide prestado **todo** el `TokenB` que tiene el Protocolo de Lending.
5. El atacante devuelve los 9,000 `TokenB` del Flash Loan original y se queda con el resto del dinero del protocolo de Lending como ganancia neta.

## 🛡️ La Solución

En el contrato `SecureLending.sol`, evitamos depender del "Spot Price" (precio instantáneo) de un único DEX, ya que es fácilmente manipulable dentro del mismo bloque. 

La solución estándar de la industria es utilizar un **Oráculo Descentralizado Seguro** (como Chainlink Price Feeds) o un **TWAP** (Time-Weighted Average Price) de Uniswap V3. Estos oráculos promedian el precio a lo largo del tiempo o consolidan datos de múltiples exchanges fuera de la cadena (off-chain). Por lo tanto, un atacante con un Flash Loan no puede alterar el precio reportado por el oráculo en una sola transacción, haciendo que el ataque sea imposible y ruinoso para el hacker.

</div>