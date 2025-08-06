import { JB_CHAINS, JBChainId } from "juice-sdk-core";
import { useBorrowableAmounts } from "./UserTokenBalanceCard/hooks/useBorrowableAmounts";

export function LoanTableRow({
  revnetId,
  chainId,
  collateralCount,
  address,
}: {
  revnetId: bigint;
  chainId: JBChainId;
  collateralCount: bigint;
  address: string;
}) {
  const { borrowableByChain, loanSummary } = useBorrowableAmounts({
    projectId: revnetId,
    address,
    balances: [
      {
        chainId,
        balance: { value: collateralCount },
      },
    ],
  });

  const borrowableAmount = borrowableByChain[chainId];
  const summary = loanSummary[chainId];

  const hasAnyBalance =
    collateralCount > 0n ||
    (borrowableAmount && borrowableAmount > 0n) ||
    (summary?.borrowAmount && summary.borrowAmount > 0n) ||
    (summary?.collateral && summary.collateral > 0n);

  if (!hasAnyBalance) return null;

  return {
    chainName: JB_CHAINS[chainId]?.name || String(chainId),
    holding: collateralCount,
    borrowable: borrowableAmount,
    debt: summary?.borrowAmount,
    collateral: summary?.collateral,
  };
}
