import { Address } from "viem";

// Minimal ABI for JBSwapTerminal.addDefaultPool(uint256,address,address)
export const jbSwapTerminalAbi = [
  {
    inputs: [
      { internalType: "uint256", name: "projectId", type: "uint256" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "pool", type: "address" },
    ],
    name: "addDefaultPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export async function addDefaultPool({
  walletClient,
  account,
  swapTerminal,
  projectId,
  token,
  pool,
}: {
  walletClient: any;
  account: `0x${string}`;
  swapTerminal: `0x${string}`; // JBSwapTerminal on the chain
  projectId: bigint;
  token: `0x${string}`; // tokenIn address (use native placeholder for ETH if contract expects)
  pool: `0x${string}`; // Uniswap V3 pool address
}) {
  return walletClient.writeContract({
    account,
    address: swapTerminal,
    abi: jbSwapTerminalAbi,
    functionName: "addDefaultPool",
    args: [projectId, token, pool],
  });
}


