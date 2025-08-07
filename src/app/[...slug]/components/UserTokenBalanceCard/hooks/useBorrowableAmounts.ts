import { useMemo } from "react";
import { JBChainId, NATIVE_TOKEN_DECIMALS } from "juice-sdk-core";
import { useQueries } from "@tanstack/react-query";
import { useBendystrawQuery } from "@/graphql/useBendystrawQuery";
import { LoansByAccountDocument } from "@/generated/graphql";
import { useReadRevLoansBorrowableAmountFrom } from "revnet-sdk";

interface Balance {
  chainId: number;
  balance: {
    value: bigint;
  };
}

interface BorrowableAmountsParams {
  projectId: bigint;
  address: string;
  balances?: Balance[];
}

const ETH_CURRENCY_ID = 1n;

export function useBorrowableAmounts({
  projectId,
  address,
  balances,
}: BorrowableAmountsParams) {
  const { data } = useBendystrawQuery(LoansByAccountDocument, {
    owner: address,
  });

  const loanSummary = useMemo(() => {
    const loans = data?.loans?.items;
    if (!loans) return {} as Record<number, { collateral: bigint; borrowAmount: bigint }>;
    return loans.reduce<Record<number, { collateral: bigint; borrowAmount: bigint }>>(
      (acc, loan) => {
        const chainId = loan.chainId;
        if (!acc[chainId]) {
          acc[chainId] = { collateral: 0n, borrowAmount: 0n };
        }
        acc[chainId].collateral += BigInt(loan.collateral);
        acc[chainId].borrowAmount += BigInt(loan.borrowAmount);
        return acc;
      },
      {}
    );
  }, [data?.loans?.items]);

  const queries = useQueries({
    queries: (balances || []).map((balance) => ({
      queryKey: [
        "borrowable",
        projectId.toString(),
        balance.chainId,
        balance.balance.value.toString(),
      ],
      queryFn: async () =>
        useReadRevLoansBorrowableAmountFrom({
          chainId: balance.chainId as JBChainId,
          args: [
            projectId,
            balance.balance.value,
            BigInt(NATIVE_TOKEN_DECIMALS),
            ETH_CURRENCY_ID,
          ],
        }),
      enabled: Boolean(projectId && balance.balance.value >= 0n),
    })),
  });

  const borrowableByChain = useMemo(() => {
    const map: Record<number, bigint | undefined> = {};
    queries.forEach((result, idx) => {
      const chainId = balances?.[idx]?.chainId;
      if (chainId !== undefined) {
        map[chainId] = result.data as bigint | undefined;
      }
    });
    return map;
  }, [queries, balances]);

  return { borrowableByChain, loanSummary };
}

export type BorrowableAmountsResult = ReturnType<typeof useBorrowableAmounts>;
