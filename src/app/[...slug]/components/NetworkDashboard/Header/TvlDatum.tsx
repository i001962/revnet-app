import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEtherPrice } from "juice-sdk-react";
import { formatUnits, JB_CHAINS, NATIVE_TOKEN_DECIMALS } from "juice-sdk-core";
import { JBChainId, useSuckersNativeTokenSurplus } from "juice-sdk-react";
import { Loader2 } from 'lucide-react';

export function TvlDatum() {
  const surplusQuery = useSuckersNativeTokenSurplus();
  const { data: ethPrice, isLoading: isEthLoading, isError: isEthError } = useEtherPrice();
  const loading = isEthLoading || surplusQuery.isLoading;
  const surpluses = surplusQuery?.data as
    | {
        surplus: bigint;
        chainId: JBChainId;
      }[]
    | undefined;
  const totalEth =
    surpluses?.reduce((acc, curr) => {
      return acc + curr.surplus;
    }, 0n) ?? 0n;

  const usd = (
    (ethPrice ?? 0) * (totalEth ? Number(formatUnits(totalEth, 18)) : 0)
  ).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (loading) return <Loader2 className="animate-spin" size={16} />;

  if (isEthError) return <span className="font-medium text-black-500">
      Ξ{typeof totalEth !== "undefined" ? 
      Number(formatUnits(totalEth, 18)).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      }) : null}
    </span>;

  if (surplusQuery.isError) return <span>Error Loading Surplus</span>

  return (
    <Tooltip>
      <TooltipTrigger>
        {typeof usd !== "undefined" ? (
          <span className="sm:text-xl text-lg">
            <span className="font-medium text-black-500">${usd}</span>{" "}
            <span className="text-zinc-500">balance</span>
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent className="w-64">
        {surpluses?.map((surplus, index) => (
          <div key={index} className="flex justify-between gap-2">
            {JB_CHAINS[surplus.chainId].name}
            {/* TODO maybe show USD-converted value here instead? */}
            <span className="font-medium">
              {formatUnits(surplus.surplus, NATIVE_TOKEN_DECIMALS, {
                fractionDigits: 4,
              })}{" "}
              ETH
            </span>
          </div>
        ))}
        <hr className="py-1" />
        <div className="flex justify-between gap-2">
          <span>[All chains]</span>
          <span className="font-medium">
            {formatUnits(totalEth, NATIVE_TOKEN_DECIMALS, {
              fractionDigits: 4,
            })}{" "}
            ETH
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
