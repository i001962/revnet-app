import { PaymentToken } from "@/hooks/useAvailablePaymentTokens";
import { NATIVE_TOKEN } from "juice-sdk-core";
import { useAccount, useBalance } from "wagmi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SelectPaymentToken({
  tokens,
  value,
  onChange,
  chainId,
}: {
  tokens: PaymentToken[];
  value: PaymentToken;
  onChange: (token: PaymentToken) => void;
  chainId?: number;
}) {
  const { address } = useAccount();

  const BalanceLine = ({ tokenAddr, decimals }: { tokenAddr: `0x${string}`; decimals: number }) => {
    const bal = useBalance({
      address,
      chainId: chainId ? Number(chainId) : undefined,
      token: tokenAddr.toLowerCase() === NATIVE_TOKEN.toLowerCase() ? undefined : tokenAddr,
      query: { enabled: Boolean(address && chainId) },
    });
    const raw = bal.data?.formatted ?? "0";
    const num = Number(raw);
    const frac = Math.min(decimals || 18, 4);
    const display = isNaN(num)
      ? raw
      : num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: frac });
    return <span>{display}</span>;
  };

  if (!tokens.length) return null;
  if (tokens.length === 1) {
    return <span className="select-none">{value.symbol}</span>;
  }

  return (
    <Select
      value={value.address}
      onValueChange={(addr) => {
        const token = tokens.find(
          (t) => t.address.toLowerCase() === (addr as `0x${string}`).toLowerCase(),
        );
        if (token) onChange(token);
      }}
    >
      <SelectTrigger className="h-auto border-none bg-transparent p-0 text-right text-lg">
        <SelectValue placeholder={value.symbol}>{value.symbol}</SelectValue>
      </SelectTrigger>
      <SelectContent className="z-[60]">
        {tokens.map((token) => (
          <SelectItem key={token.address} value={token.address} className="w-full">
            <div className="flex w-full items-center gap-3">
              <span className="truncate w-[80px]">{token.symbol}</span>
              <div className="ml-auto w-[110px] text-right truncate">
                <BalanceLine tokenAddr={token.address} decimals={token.decimals} />
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
