// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {IERC20Metadata} from "openzeppelin-contracts/interfaces/IERC20Metadata.sol";

contract TokenFactoryTest is Test {
    TokenFactory internal factory;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    // Mirror of TokenFactory.TokenCreated so expectEmit can compare topic0.
    event TokenCreated(
        address indexed creator,
        address indexed token,
        string name,
        string symbol,
        uint256 supply
    );

    function setUp() public {
        factory = new TokenFactory();
    }

    function test_CreatesTokenWithMetadataAndSupply() public {
        vm.prank(alice);
        address token = factory.createToken("Studio Token", "STUDIO", 1_000);

        assertTrue(token.code.length > 0, "no runtime code");
        assertEq(IERC20Metadata(token).name(), "Studio Token");
        assertEq(IERC20Metadata(token).symbol(), "STUDIO");
        assertEq(IERC20Metadata(token).decimals(), 18);
        assertEq(IERC20Metadata(token).totalSupply(), 1_000e18);
        assertEq(IERC20Metadata(token).balanceOf(alice), 1_000e18, "supply not to creator");
    }

    function test_EmitsTokenCreatedEvent() public {
        // Creator (topic1) is known beforehand; the token address (topic2)
        // and data are wildcarded because the token is created by the call itself.
        vm.expectEmit(true, false, false, false);
        emit TokenCreated(alice, address(0), "", "", 0);

        vm.prank(alice);
        address token = factory.createToken("Studio Token", "STUDIO", 500);

        assertTrue(token != address(0));
    }

    function test_TracksTokensPerCreator() public {
        vm.startPrank(alice);
        address first = factory.createToken("One", "ONE", 100);
        address second = factory.createToken("Two", "TWO", 200);
        vm.stopPrank();

        vm.prank(bob);
        factory.createToken("Three", "THREE", 300);

        address[] memory aliceTokens = factory.tokensOf(alice);
        assertEq(aliceTokens.length, 2);
        assertEq(aliceTokens[0], first);
        assertEq(aliceTokens[1], second);

        assertEq(factory.tokenCountOf(alice), 2);
        assertEq(factory.tokenCountOf(bob), 1);
        assertEq(factory.tokenCountOf(address(this)), 0);
    }

    function test_RevertWhen_SymbolEmpty() public {
        vm.prank(alice);
        vm.expectRevert(TokenFactory.EmptySymbol.selector);
        factory.createToken("No Symbol", "", 100);
    }

    function test_RevertWhen_SupplyZero() public {
        vm.prank(alice);
        vm.expectRevert(TokenFactory.ZeroSupply.selector);
        factory.createToken("Zero Supply", "ZERO", 0);
    }

    function testFuzz_CreatesTokenWithArbitrarySupply(uint256 supply, string calldata name, string calldata symbol)
        public
    {
        vm.assume(bytes(symbol).length > 0);
        supply = bound(supply, 1, type(uint256).max / 1e18);

        vm.prank(alice);
        address token = factory.createToken(name, symbol, supply);

        assertEq(IERC20Metadata(token).totalSupply(), supply * 1e18);
        assertEq(IERC20Metadata(token).balanceOf(alice), supply * 1e18);
        assertEq(IERC20Metadata(token).name(), name);
        assertEq(IERC20Metadata(token).symbol(), symbol);
    }
}
