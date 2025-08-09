import { useJBChainId } from "juice-sdk-react";
import { NATIVE_TOKEN, NATIVE_TOKEN_DECIMALS, JB_CHAINS } from "juice-sdk-core";
import { USDC_ADDRESSES, USDC_DECIMALS, SUPPORTED_TOKENS } from "@/app/constants";
import { useMemo } from "react";
import { useBendystrawQuery } from "@/graphql/useBendystrawQuery";
import { ProjectDocument, SuckerGroupDocument } from "@/generated/graphql";
import { useJBContractContext } from "juice-sdk-react";

export type PaymentToken = {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
};

export function useAvailablePaymentTokens(targetChainId?: number): PaymentToken[] {
  const chainId = useJBChainId();
  const { projectId } = useJBContractContext();

  // Get suckerGroupId for current project
  const { data: projectData } = useBendystrawQuery(
    ProjectDocument,
    { chainId: Number(chainId), projectId: Number(projectId) },
    { enabled: !!chainId && !!projectId },
  );
  const suckerGroupId = projectData?.project?.suckerGroupId;

  // Fetch sucker group projects to include base tokens per chain
  const { data: suckerGroupData } = useBendystrawQuery(
    SuckerGroupDocument,
    { id: suckerGroupId ?? "" },
    { enabled: !!suckerGroupId },
  );

  return useMemo(() => {
    const activeChainId = (targetChainId ?? Number(chainId)) as number | undefined;
    if (!activeChainId) return [];
    const tokens: PaymentToken[] = [];

    const addToken = (
      symbol: string,
      address: `0x${string}`,
      decimals: number,
      isNative: boolean,
    ) => {
      const exists = tokens.some((t) => t.address.toLowerCase() === address.toLowerCase());
      if (!exists) tokens.push({ symbol, address, decimals, isNative });
    };

    // Native token
    addToken("ETH", NATIVE_TOKEN, NATIVE_TOKEN_DECIMALS, true);

    // USDC on this chain
    const usdcAddress = USDC_ADDRESSES[Number(activeChainId)];
    if (usdcAddress) addToken("USDC", usdcAddress, USDC_DECIMALS, false);

    // Registry tokens (jbpay-sdk)
    const registry = SUPPORTED_TOKENS[Number(activeChainId)];
    if (registry) {
      Object.entries(registry).forEach(([sym, [addr, dec]]) => {
        addToken(sym, addr as `0x${string}`, dec, false);
      });
    }

    // Project base token for this chain (from sucker group)
    const projectForChain = suckerGroupData?.suckerGroup?.projects?.items?.find(
      (p) => Number(p.chainId) === Number(activeChainId) && p.token,
    );
    if (projectForChain?.token) {
      addToken(
        "TOKEN",
        projectForChain.token as `0x${string}`,
        Number(projectForChain.decimals ?? 18),
        false,
      );
    }

    return tokens;
  }, [targetChainId, chainId, suckerGroupData]);
}
