import { erc20Abi, type Address } from "viem";

/**
 * WETH9 is an OP Stack predeploy, so the address is identical on Base mainnet
 * and Base Sepolia.
 */
export const WETH_ADDRESS: Address =
  "0x4200000000000000000000000000000000000006";

export const weth9Abi = [
  ...erc20Abi,
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;

export { erc20Abi };
