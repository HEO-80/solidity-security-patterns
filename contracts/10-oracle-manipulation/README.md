<div align="center">

<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"/>
<img src="https://img.shields.io/badge/Chainlink-2A5ADA?style=for-the-badge&logo=chainlink&logoColor=white"/>
<img src="https://img.shields.io/badge/Vulnerabilidad-Critica-red?style=for-the-badge"/>

<br/>

# 10 - Oracle Manipulation (Manipulación de Oráculos)

Los contratos inteligentes no pueden acceder a datos del mundo exterior (como el precio actual del oro, o la cotización ETH/USD) por sí mismos. Necesitan un "Oráculo" que les inyecte esta información. 

El error más común y devastador en DeFi es crear un **Oráculo de Precio Instantáneo (Spot Price Oracle)** utilizando las reservas de liquidez de un exchange descentralizado (AMM) en el bloque actual. Como la liquidez en un DEX determina el precio, cualquiera con suficiente capital (o usando un Flash Loan) puede alterar temporalmente el balance del pool de liquidez, provocando que el oráculo reporte un precio artificialmente alto o bajo.

---

## 💥 El Ataque

En el contrato `OptionsVulnerable.sol`, los usuarios pueden acuñar opciones sintéticas respaldadas por un token. Para saber cuánto vale el token, el contrato consulta un oráculo rudimentario (`getSpotPrice()`) que simplemente divide la cantidad de WETH por la cantidad de Tokens en un pool de liquidez.

Un atacante realiza el siguiente movimiento:
1. Observa que el precio normal es 1 Token = 1 WETH.
2. Realiza un swap masivo en el DEX, inundando el pool con Tokens y sacando casi todo el WETH. 
3. Como resultado, la proporción matemática se rompe. El oráculo ahora cree falsamente que 1 Token no vale nada (o que vale muchísimo, dependiendo de la dirección del ataque).
4. El atacante interactúa con el contrato vulnerable y liquida posiciones de otros usuarios de manera injusta o compra activos a un precio ridículamente bajo basándose en este precio manipulado.

## 🛡️ La Solución

En el contrato `OptionsSecure.sol`, se elimina por completo la dependencia de balances internos o precios instantáneos de un solo exchange. 

En su lugar, se integra la interfaz `AggregatorV3Interface` de **Chainlink**. Chainlink utiliza una red descentralizada de nodos independientes que recopilan precios de múltiples exchanges (centralizados y descentralizados), filtran anomalías y promedian el resultado antes de enviarlo a la blockchain. 

Al usar `latestRoundData()`, el contrato inteligente obtiene un precio altamente resistente a la manipulación. Ni siquiera un Flash Loan masivo puede alterar el precio de Chainlink, ya que este se consolida fuera de la cadena y se actualiza de manera segura, protegiendo los fondos del protocolo contra cualquier distorsión del mercado local.

</div>