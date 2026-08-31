// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {FactoryToken} from "./FactoryToken.sol";

/// @title TokenFactory
/// @author Base Token Studio
/// @notice Deploys fixed-supply ERC-20 tokens and tracks which addresses
///         created which tokens, so a frontend can list a creator's tokens
///         by reading {TokenCreated} events instead of keeping an index.
/// @dev The factory holds no funds and has no admin functions — a compromised
///      owner can never exist here because there is no owner.
contract TokenFactory {
    /// @notice A new token was created.
    /// @param creator Address that paid for the deployment and received the supply.
    /// @param token   Address of the freshly deployed ERC-20.
    /// @param name    ERC-20 name of the token.
    /// @param symbol  ERC-20 symbol of the token.
    /// @param supply  Total supply in whole tokens (18 decimals applied by the token).
    event TokenCreated(
        address indexed creator,
        address indexed token,
        string name,
        string symbol,
        uint256 supply
    );

    /// @notice Rejects an empty ERC-20 symbol — a token without one is
    ///         almost always a typo or spam.
    error EmptySymbol();

    /// @notice Rejects a zero supply — creating a token nobody can hold
    ///         is a wasted transaction.
    error ZeroSupply();

    /// @notice creator => list of token addresses they created via this factory.
    mapping(address => address[]) private _tokensOf;

    /// @notice Deploy a new fixed-supply ERC-20.
    ///         The entire supply is minted to `msg.sender`.
    /// @param name   ERC-20 name (may be empty — names are cosmetic).
    /// @param symbol ERC-20 symbol (must not be empty).
    /// @param supply Total supply in whole tokens; must be > 0.
    /// @return token Address of the deployed token.
    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 supply
    ) external returns (address token) {
        if (bytes(symbol).length == 0) revert EmptySymbol();
        if (supply == 0) revert ZeroSupply();

        token = address(new FactoryToken(name, symbol, msg.sender, supply));
        _tokensOf[msg.sender].push(token);

        emit TokenCreated(msg.sender, token, name, symbol, supply);
    }

    /// @notice All tokens created by `creator` through this factory, in order.
    function tokensOf(address creator) external view returns (address[] memory) {
        return _tokensOf[creator];
    }

    /// @notice Number of tokens created by `creator` through this factory.
    function tokenCountOf(address creator) external view returns (uint256) {
        return _tokensOf[creator].length;
    }
}
