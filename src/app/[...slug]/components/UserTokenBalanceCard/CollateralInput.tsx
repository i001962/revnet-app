import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChainLogo } from "@/components/ChainLogo";
import { JB_CHAINS, JBChainId } from "juice-sdk-core";
import { formatUnits } from "viem";
import { useMemo } from "react";

interface BalanceInfo {
  chainId: number;
  balance: {
    value: bigint;
    format: (decimals?: number) => string;
  };
}

interface CollateralInputProps {
  label: string;
  tokenSymbol: string;
  collateralAmount: string;
  onCollateralChange: (value: string) => void;
  projectTokenDecimals: number;
  balances?: BalanceInfo[];
  cashOutChainId?: string;
  onChainSelect?: (chainId: string) => void;
  showChainSelect?: boolean;
  presetPercents?: number[];
  includeZero?: boolean;
  placeholder?: string;
  maxValue?: string | number;
}

export function CollateralInput({
  label,
  tokenSymbol,
  collateralAmount,
  onCollateralChange,
  projectTokenDecimals,
  balances,
  cashOutChainId,
  onChainSelect,
  showChainSelect = true,
  presetPercents = [10, 25, 50],
  includeZero = false,
  placeholder,
  maxValue,
}: CollateralInputProps) {
  const selectedBalance = useMemo(
    () =>
      balances && cashOutChainId
        ? balances.find((b) => b.chainId === Number(cashOutChainId))
        : undefined,
    [balances, cashOutChainId]
  );

  const maxAmount = useMemo(() => {
    if (typeof maxValue !== "undefined") return Number(maxValue);
    if (selectedBalance)
      return Number(
        formatUnits(selectedBalance.balance.value, projectTokenDecimals)
      );
    return undefined;
  }, [maxValue, selectedBalance, projectTokenDecimals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      onCollateralChange("");
      return;
    }

    const decimalIndex = value.indexOf(".");
    if (decimalIndex !== -1 && value.length - decimalIndex - 1 > 8) {
      return;
    }

    const numValue = Number(value);

    if (!isNaN(numValue)) {
      if (maxAmount !== undefined && numValue > maxAmount) {
        onCollateralChange(maxAmount.toFixed(6));
      } else {
        onCollateralChange(value);
      }
    } else {
      onCollateralChange(value);
    }
  };

  const handlePercentClick = (pct: number) => {
    if (maxAmount !== undefined) {
      const value = maxAmount * (pct / 100);
      onCollateralChange(value.toFixed(6));
    }
  };

  const handleMaxClick = () => {
    if (maxAmount !== undefined) {
      onCollateralChange(maxAmount.toFixed(8));
    }
  };

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="collateral-amount" className="text-zinc-900">
        {label}
      </Label>
      <div className="grid grid-cols-7 gap-2">
        <div className={showChainSelect ? "col-span-4" : "col-span-7"}>
          <div className="relative">
            <Input
              id="collateral-amount"
              name="collateral-amount"
              type="number"
              step="0.0001"
              max={maxAmount}
              value={collateralAmount}
              onChange={handleChange}
              placeholder={
                placeholder ||
                (maxAmount !== undefined
                  ? maxAmount.toFixed(8)
                  : "Enter amount")
              }
              className="mt-2"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 z-10">
              <span className="text-zinc-500 sm:text-md">{tokenSymbol}</span>
            </div>
          </div>
        </div>
        {showChainSelect && balances && onChainSelect && (
          <div className="col-span-3">
            <Select
              onValueChange={onChainSelect}
              value={cashOutChainId || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select chain">
                  {cashOutChainId && (
                    <div className="flex items-center gap-2">
                      <ChainLogo chainId={Number(cashOutChainId) as JBChainId} />
                      <span>
                        {
                          JB_CHAINS[Number(cashOutChainId) as JBChainId].name
                        }
                      </span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {balances
                  ?.filter((b) => b.balance.value > 0n)
                  .map((balance) => (
                    <SelectItem
                      value={balance.chainId.toString()}
                      key={balance.chainId}
                    >
                      <div className="flex items-center gap-2">
                        <ChainLogo chainId={balance.chainId as JBChainId} />
                        {JB_CHAINS[balance.chainId as JBChainId].name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-7 gap-2">
        <div className={showChainSelect ? "col-span-4" : "col-span-7"}>
          <div className="flex gap-1 mt-1 mb-2">
            {includeZero && (
              <button
                type="button"
                onClick={() => onCollateralChange("0")}
                className="h-10 px-3 text-sm text-zinc-700 border border-zinc-300 rounded-md bg-white hover:bg-zinc-100"
              >
                0
              </button>
            )}
            {presetPercents.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentClick(pct)}
                className="h-10 px-3 text-sm text-zinc-700 border border-zinc-300 rounded-md bg-white hover:bg-zinc-100"
              >
                {pct}%
              </button>
            ))}
            <button
              type="button"
              onClick={handleMaxClick}
              className="h-10 px-3 text-sm text-zinc-700 border border-zinc-300 rounded-md bg-white hover:bg-zinc-100"
            >
              Max
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

