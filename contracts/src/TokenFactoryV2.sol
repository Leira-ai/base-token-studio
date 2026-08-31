// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {FactoryTokenV2} from "./FactoryTokenV2.sol";

/// @title TokenFactoryV2
/// @notice Adds optional burnability and on-chain metadata (description +
///         image URI) to the v1 factory, in response to community feedback:
///         creators asked "how do I brand and share my token?", holders asked
///         "can supply ever be taken back?" (burn lets holders self-protect).
/// @dev Still no owner, no admin, holds no funds. V1 stays deployed unchanged.
contract TokenFactoryV2 {
    struct TokenInfo {
        string description;
        string imageURI;
        bool burnable;
    }

    /// @notice A new token was created.
    /// @param creator     Address that paid for the deployment.
    /// @param token       Address of the freshly deployed ERC-20.
    /// @param name        ERC-20 name.
    /// @param symbol      ERC-20 symbol.
    /// @param supply      Total supply in whole tokens (18 decimals applied by the token).
    /// @param burnable    Whether holders can burn their own tokens.
    /// @param description Free-text description set by the creator.
    /// @param imageURI    Logo URL set by the creator (IPFS recommended).
    event TokenCreated(
        address indexed creator,
        address indexed token,
        string name,
        string symbol,
        uint256 supply,
        bool burnable,
        string description,
        string imageURI
    );

    error EmptySymbol();
    error ZeroSupply();
    /// @notice Metadata strings must both fit, or the tx is a wasted deploy.
    error MetadataTooLong();

    uint256 private constant MAX_DESCRIPTION = 280;
    uint256 private constant MAX_IMAGE_URI = 200;

    mapping(address => address[]) private _tokensOf;
    mapping(address => TokenInfo) public tokenInfo;

    /// @notice Deploy a new fixed-supply ERC-20 with optional burn + metadata.
    ///         The entire supply is minted to `msg.sender`.
    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 supply,
        bool burnable,
        string calldata description,
        string calldata imageURI
    ) external returns (address token) {
        if (bytes(symbol).length == 0) revert EmptySymbol();
        if (supply == 0) revert ZeroSupply();
        if (bytes(description).length > MAX_DESCRIPTION) revert MetadataTooLong();
        if (bytes(imageURI).length > MAX_IMAGE_URI) revert MetadataTooLong();

        token = address(new FactoryTokenV2(name, symbol, msg.sender, supply, burnable));
        _tokensOf[msg.sender].push(token);
        tokenInfo[token] = TokenInfo(description, imageURI, burnable);

        emit TokenCreated(msg.sender, token, name, symbol, supply, burnable, description, imageURI);
    }

    /// @notice All tokens created by `creator` through this factory, in order.
    function tokensOf(address creator) external view returns (address[] memory) {
        return _tokensOf[creator];
    }

    function tokenCountOf(address creator) external view returns (uint256) {
        return _tokensOf[creator].length;
    }
}
