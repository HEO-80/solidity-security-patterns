// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title MockVRFCoordinator
 * @dev Simula el comportamiento asíncrono de Chainlink VRF en un entorno local.
 */
contract MockVRFCoordinator {
    RouletteSecure public roulette;
    
    function setRoulette(address _roulette) external {
        roulette = RouletteSecure(_roulette);
    }

    // Simula el oráculo inyectando un número aleatorio real fuera de la cadena
    function fulfillRandomness(uint256 _requestId, uint256 _randomWord) external {
        roulette.rawFulfillRandomWords(_requestId, _randomWord);
    }
}

/**
 * @title RouletteSecure
 * @notice SECURE CONTRACT — Utiliza un VRF (Mock) asíncrono para la aleatoriedad.
 */
contract RouletteSecure {
    MockVRFCoordinator public coordinator;
    
    struct Bet {
        address player;
        uint256 guess;
    }

    mapping(uint256 => Bet) public activeBets;
    uint256 public nextRequestId = 1;

    constructor(address _coordinator) payable {
        require(msg.value == 10 ether, "Debe fondear con 10 ETH");
        coordinator = MockVRFCoordinator(_coordinator);
    }

    // Paso 1: El jugador hace su apuesta y solicita la aleatoriedad
    function spin(uint256 _guess) external payable returns (uint256 requestId) {
        require(msg.value == 1 ether, "La apuesta es de 1 ETH");
        require(_guess == 0 || _guess == 1, "Adivina 0 (Par) o 1 (Impar)");

        requestId = nextRequestId++;
        activeBets[requestId] = Bet(msg.sender, _guess);
        
        // En producción, aquí se llamaría a coordinator.requestRandomWords()
        return requestId;
    }

    // Paso 2: El oráculo devuelve el número seguro. (Solo el Oráculo debería poder llamar esto)
    function rawFulfillRandomWords(uint256 _requestId, uint256 _randomWord) external {
        require(msg.sender == address(coordinator), "Solo el oraculo puede responder");
        
        Bet memory userBet = activeBets[_requestId];
        require(userBet.player != address(0), "Apuesta no encontrada");

        // FIX: Calculamos el resultado usando el número aleatorio inmutable del Oráculo
        uint256 result = _randomWord % 2;

        if (result == userBet.guess) {
            uint256 payout = address(this).balance;
            (bool success, ) = userBet.player.call{value: payout}("");
            require(success, "Fallo al pagar");
        }

        delete activeBets[_requestId];
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}