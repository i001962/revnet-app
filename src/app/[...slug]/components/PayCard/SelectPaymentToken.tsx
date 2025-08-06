import { PaymentToken } from "@/hooks/useAvailablePaymentTokens";
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
}: {
  tokens: PaymentToken[];
  value: PaymentToken;
  onChange: (token: PaymentToken) => void;
}) {
  if (!tokens.length) return null;
  if (tokens.length === 1) {
    return <span className="select-none">{value.symbol}</span>;
  }

  return (
    <Select
      value={value.address}
      onValueChange={(addr) => {
        const token = tokens.find((t) => t.address === (addr as `0x${string}`));
        if (token) onChange(token);
      }}
    >
      <SelectTrigger className="h-auto border-none bg-transparent p-0 text-right text-lg">
        <SelectValue placeholder={value.symbol} />
      </SelectTrigger>
      <SelectContent>
        {tokens.map((token) => (
          <SelectItem key={token.address} value={token.address}>
            {token.symbol}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
