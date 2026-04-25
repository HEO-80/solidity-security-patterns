<div align="center">

<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"/>
<img src="https://img.shields.io/badge/OpenZeppelin-4e5ee4?style=for-the-badge&logo=openzeppelin&logoColor=white"/>
<img src="https://img.shields.io/badge/Vulnerabilidad-Critica-red?style=for-the-badge"/>

<br/>

# 03 - Access Control Failure (Fallo de Control de Acceso)

El control de acceso determina "quién puede hacer qué" dentro de un contrato inteligente. Cuando una función que maneja lógica crítica (como mover fondos, cambiar el administrador o pausar el contrato) no verifica correctamente la identidad del remitente (`msg.sender`), cualquier usuario en la red puede ejecutarla.

Esta vulnerabilidad es tristemente famosa por causar algunos de los mayores hackeos en la historia de Web3, como el de Poly Network o los incidentes de la billetera Parity, donde funciones de inicialización o retiro se dejaron completamente públicas.

---

## 💥 El Ataque

En el contrato `VaultVulnerable.sol`, los usuarios depositan fondos confiando en la seguridad de la bóveda. El desarrollador incluyó una función `emergencyWithdrawAll()` diseñada para rescatar los fondos en caso de emergencia. 

Sin embargo, olvidaron añadir un verificador de permisos. Un atacante simplemente necesita llamar a la función `emergencyWithdrawAll()`. Como no hay ninguna línea de código que detenga la ejecución basada en la dirección del atacante, el contrato toma todo su balance (depositado por usuarios legítimos) y se lo transfiere directamente a la billetera del hacker.

## 🛡️ La Solución

En el contrato `VaultSecure.sol`, se implementa un patrón robusto utilizando un modificador (`modifier`). 
1. Se define `onlyOwner`, que comprueba que `msg.sender == owner`.
2. Se inyecta este modificador en la firma de la función `emergencyWithdrawAll() external onlyOwner`.
3. Cuando un atacante intenta llamar a la función, la transacción revierte inmediatamente con el mensaje *"Acceso denegado: No eres el owner"*, bloqueando el robo.

*(Nota: En producción, es altamente recomendable usar la librería `Ownable` o `AccessControl` de OpenZeppelin en lugar de escribir modificadores manuales).*

</div>