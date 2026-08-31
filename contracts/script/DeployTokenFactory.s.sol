// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {TokenFactory} from "../src/TokenFactory.sol";

/// @notice Deploys TokenFactory to a live network.
/// Run (private key stays in env, never in the command line):
///   forge script script/DeployTokenFactory.s.sol \
///     --rpc-url base_sepolia --broadcast --slow
contract DeployTokenFactory is Script {
    function run() external returns (TokenFactory factory) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        factory = new TokenFactory();
        vm.stopBroadcast();

        console2.log("TokenFactory deployed at:", address(factory));
    }
}
