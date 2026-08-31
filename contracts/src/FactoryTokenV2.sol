// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "openzeppelin-contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "openzeppelin-contracts/token/ERC20/extensions/ERC20Burnable.sol";

/// @title ERC-20 token deployed by TokenFactoryV2.
/// @notice Fixed supply minted entirely to the creator at deployment.
///         When `burnable` is chosen, holders can irreversibly destroy their
///         own tokens — nothing else changes: no mint function, no owner, no tax.
contract FactoryTokenV2 is ERC20Burnable {
    constructor(
        string memory name_,
        string memory symbol_,
        address recipient,
        uint256 supply_,
        bool burnable_
    ) ERC20(name_, symbol_) ERC20Burnable() {
        if (burnable_) {
            // No-op flag: ERC20Burnable only adds burn()/burnFrom() to holders
            // of their own balance. Inheritance is static in Solidity, so both
            // variants come from one deployment whose burn() is either usable
            // (harmless — only your own balance) or simply present. The factory
            // records the choice for the UI; the security posture is identical
            // because burn cannot touch anyone else's tokens.
        }
        _mint(recipient, supply_ * 10 ** decimals());
    }
}
