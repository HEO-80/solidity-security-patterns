// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @dev Interfaz estándar de Chainlink para feeds de datos
 */
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/**
 * @title MockChainlinkOracle
 * @dev Simulación local de un feed de precios inmutable de Chainlink
 */
contract MockChainlinkOracle is AggregatorV3Interface {
    int256 private price = 1e18; // Precio seguro y constante

    function latestRoundData()
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (1, price, block.timestamp, block.timestamp, 1);
    }
}

/**
 * @title OptionsSecure
 * @notice SECURE CONTRACT — Obtiene el precio de un oráculo descentralizado (Chainlink)
 */
contract OptionsSecure {
    AggregatorV3Interface public priceFeed;

    constructor(address _priceFeedAddress) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }

    // FIX: El precio se obtiene de una red de nodos externa, no del balance local
    function getSecurePrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Precio de oraculo invalido");
        
        return uint256(price);
    }

    function calculateReward(uint256 _tokenAmount) external view returns (uint256) {
        uint256 currentPrice = getSecurePrice();
        return (_tokenAmount * currentPrice) / 1e18;
    }
}