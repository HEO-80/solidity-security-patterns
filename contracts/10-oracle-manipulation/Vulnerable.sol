// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SimplePool
 * @dev Un pool rudimentario para simular la liquidez de un DEX
 */
contract SimplePool {
    ERC20 public token;
    ERC20 public weth;

    constructor(address _token, address _weth) {
        token = ERC20(_token);
        weth = ERC20(_weth);
    }
}

/**
 * @title OptionsVulnerable
 * @notice VULNERABLE CONTRACT — Usa el Spot Price de un pool como Oráculo
 */
contract OptionsVulnerable {
    SimplePool public pool;
    ERC20 public token;
    ERC20 public weth;

    constructor(address _poolAddress) {
        pool = SimplePool(_poolAddress);
        token = pool.token();
        weth = pool.weth();
    }

    // VULNERABILIDAD: Calcula el precio basándose en los balances actuales del pool.
    // Esto es fácilmente manipulable alterando los balances antes de llamar a esta función.
    function getSpotPrice() public view returns (uint256) {
        uint256 wethBalance = weth.balanceOf(address(pool));
        uint256 tokenBalance = token.balanceOf(address(pool));
        require(tokenBalance > 0, "No hay liquidez");
        
        // Retorna el precio del Token expresado en WETH (escalado por 1e18)
        return (wethBalance * 1e18) / tokenBalance;
    }

    // Una función que emite una recompensa basada en el precio supuesto del token
    function calculateReward(uint256 _tokenAmount) external view returns (uint256) {
        uint256 currentPrice = getSpotPrice();
        return (_tokenAmount * currentPrice) / 1e18;
    }
}