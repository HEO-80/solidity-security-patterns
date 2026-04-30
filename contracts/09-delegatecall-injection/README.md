<div align="center">

<img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"/>
<img src="https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white"/>
<img src="https://img.shields.io/badge/Vulnerabilidad-Critica-red?style=for-the-badge"/>

<br/>

# 09 - Delegatecall Injection (Inyección de Delegatecall)

`delegatecall` es una función de bajo nivel en Solidity que permite a un contrato cargar y ejecutar dinámicamente el código de un contrato diferente en tiempo de ejecución. La distinción crítica de `delegatecall` es que el código objetivo se ejecuta enteramente dentro del contexto del contrato que realiza la llamada (el "caller"). Esto significa que el código importado lee y escribe directamente en las variables de estado (storage) del contrato llamador, conserva el `msg.sender` original y mantiene el `msg.value` de la transacción inicial.

Cuando un contrato permite que un usuario externo especifique la dirección del contrato objetivo o los datos de la carga útil (payload) para un `delegatecall`, se crea un vector de ataque de inyección. Un atacante puede proporcionar la dirección de un contrato malicioso de su propia creación. Al ejecutarse, las instrucciones maliciosas sobrescribirán las variables de estado críticas del contrato vulnerable (típicamente manipulando el diseño de las ranuras de almacenamiento o *storage slots*), lo que le permite al atacante escalar privilegios, tomar el control del contrato al sobrescribir la variable `owner`, o incluso destruir el contrato usando `selfdestruct`.

Para visualizarlo, imagina el funcionamiento de la cocina de un restaurante (el contrato original) que ocasionalmente contrata a chefs independientes (el contrato objetivo). Si el restaurante utiliza el modelo de `delegatecall`, le está dando al chef externo acceso total a sus propios ingredientes, a sus propias herramientas y a su propia caja registradora, permitiéndole operar dentro de sus instalaciones. Si el restaurante permite que un cliente cualquiera decida *qué* chef independiente contratar, el cliente traerá a un cómplice que entrará a la cocina del restaurante y vaciará la caja registradora desde adentro.

---

## 💥 El Ataque

En el contrato `ProxyVulnerable.sol`, existe una función `executeDelegated(address _target, bytes memory _data)` diseñada para permitir cierta flexibilidad en la ejecución de lógicas externas. 

1. El atacante despliega un contrato `AttackerLogic`. Este contrato está diseñado con una estructura de almacenamiento (storage) que coincide exactamente con el contrato vulnerable (la ranura 0 es `owner`). Contiene una función `pwn()` que cambia el `owner` por `tx.origin`.
2. El atacante llama a la función `executeDelegated` del Proxy, pasando como parámetros la dirección de su `AttackerLogic` y la firma de la función `pwn()`.
3. El Proxy ejecuta `delegatecall` hacia el contrato malicioso.
4. El contrato malicioso instruye: *"Cambia la variable en el Slot 0 por la dirección del atacante"*. Como está en el contexto de `delegatecall`, el Proxy obedece y sobrescribe **su propio** Slot 0.
5. El atacante es ahora el dueño del contrato Proxy.

## 🛡️ La Solución

En el contrato `ProxySecure.sol`, el uso de `delegatecall` se blinda eliminando el control del usuario sobre el destino de la ejecución.

La dirección objetivo (`trustedLogic`) se almacena en el estado del contrato y no se pasa como un parámetro abierto. Solo un administrador autorizado puede modificar esta dirección de destino mediante un patrón de actualización seguro (`upgradeLogic`). Cuando un usuario llama a la función delegada, el contrato realiza el `delegatecall` estrictamente hacia la lógica pre-aprobada e inmutable para ese bloque, haciendo imposible la inyección de código de terceros.

</div>