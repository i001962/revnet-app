import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { JBChainId } from "juice-sdk-react";
import { revDeployerAddress } from "revnet-sdk";
import { wagmiConfig } from "@/lib/wagmiConfig";

const revDeployerLoansOfAbi = [
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "loansOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function getRevLoansAddress({
  revnetId,
  chainId,
}: {
  revnetId: bigint;
  chainId: JBChainId;
}) {
  return (await readContract(wagmiConfig, {
    chainId,
    address: revDeployerAddress[chainId],
    abi: revDeployerLoansOfAbi,
    functionName: "loansOf",
    args: [revnetId],
  })) as `0x${string}`;
}

export function useReadRevDeployerLoansOf({
  revnetId,
  chainId,
  enabled = true,
}: {
  revnetId?: bigint;
  chainId?: JBChainId;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["revDeployer", "loansOf", chainId, revnetId?.toString()],
    queryFn: () =>
      getRevLoansAddress({
        revnetId: revnetId as bigint,
        chainId: chainId as JBChainId,
      }),
    enabled: enabled && revnetId !== undefined && chainId !== undefined,
  });
}

export type UseReadRevDeployerLoansOfResult = ReturnType<
  typeof useReadRevDeployerLoansOf
>;
