import { useJBChainId } from "juice-sdk-react";
import { NATIVE_TOKEN, NATIVE_TOKEN_DECIMALS } from "juice-sdk-core";
import { USDC_ADDRESSES, USDC_DECIMALS } from "@/app/constants";
import { useMemo } from "react";

export type PaymentToken = {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
};

export function useAvailablePaymentTokens(): PaymentToken[] {
  const chainId = useJBChainId();

  return useMemo(() => {
    const tokens: PaymentToken[] = [
      {
        symbol: "ETH",
        address: NATIVE_TOKEN,
        decimals: NATIVE_TOKEN_DECIMALS,
        isNative: true,
      },
    ];

    const usdcAddress = chainId ? USDC_ADDRESSES[Number(chainId)] : undefined;
    if (usdcAddress) {
      tokens.push({
        symbol: "USDC",
        address: usdcAddress,
        decimals: USDC_DECIMALS,
        isNative: false,
      });
    }

    return tokens;
  }, [chainId]);
}
