// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console2} from "forge-std/Script.sol";
import {TokenFactoryV2} from "../src/TokenFactoryV2.sol";

/// @notice Deploys TokenFactoryV2 to a live network.
/// Run (private key stays in env, never in the command line):
///   forge script script/DeployTokenFactoryV2.s.sol \
///     --rpc-url base_sepolia --broadcast --slow
contract DeployTokenFactoryV2 is Script {
    function run() external returns (TokenFactoryV2 factory) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        factory = new TokenFactoryV2();
        vm.stopBroadcast();

        console2.log("TokenFactoryV2 deployed at:", address(factory));
    }
}
