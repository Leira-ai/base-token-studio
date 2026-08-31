// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "openzeppelin-contracts/token/ERC20/ERC20.sol";

/// @title Fixed-supply ERC-20 token deployed by TokenFactory.
/// @author Base Token Studio
/// @notice A plain ERC-20 with a fixed total supply minted entirely to the
///         creator. Ownership and defaults are intentionally left out — the
///         factory produces the simplest honest token possible.
contract FactoryToken is ERC20 {
    /// @param name_     ERC-20 name, chosen by the creator.
    /// @param symbol_   ERC-20 symbol, chosen by the creator.
    /// @param recipient Address receiving the entire initial supply.
    /// @param supply_   Total supply, in whole tokens; minted as 18-decimals.
    constructor(
        string memory name_,
        string memory symbol_,
        address recipient,
        uint256 supply_
    ) ERC20(name_, symbol_) {
        _mint(recipient, supply_ * 10 ** decimals());
    }
}
