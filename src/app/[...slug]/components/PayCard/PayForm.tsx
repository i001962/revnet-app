import { FixedInt } from "fpnum";
import { getTokenAToBQuote, getTokenBtoAQuote, NATIVE_TOKEN, NATIVE_TOKEN_DECIMALS, formatUnits as formatUnitsJB } from "juice-sdk-core";
import { NativeTokenValue } from "@/components/NativeTokenValue";
import { Field, Formik } from "formik";
import { useJBRulesetContext, useJBTokenContext } from "juice-sdk-react";
import { useEffect, useState } from "react";
import { formatUnits, parseEther, parseUnits } from "viem";
import { PayDialog } from "./PayDialog";
import { PayInput } from "./PayInput";
import { formatTokenSymbol } from "@/lib/utils";
// Swaps disabled: pay only in base token
import { useProjectBaseToken } from "@/hooks/useProjectBaseToken";
// import { SelectPaymentToken } from "./SelectPaymentToken";
import { useSelectedSucker } from "./SelectedSuckerContext";
import { useAccount, useBalance } from "wagmi";

export function PayForm() {
  const { selectedSucker } = useSelectedSucker();
  const baseTokenInfo = useProjectBaseToken();
  const [selectedToken, setSelectedToken] = useState<{
    address: `0x${string}`;
    symbol: string;
    decimals: number;
  } | null>(null);
  useEffect(() => {
    const chainId = selectedSucker?.peerChainId as number | undefined;
    if (!chainId) return;
    const cfg = baseTokenInfo.tokenMap[
      chainId as keyof typeof baseTokenInfo.tokenMap
    ];
    if (!cfg) return;
    const baseSymbol = baseTokenInfo.tokenType === "USDC" ? "USDC" : "ETH";
    const next = {
      address: cfg.token,
      symbol: baseSymbol,
      decimals: cfg.decimals ?? 18,
    } as const;
    // Avoid state churn if unchanged
    if (
      selectedToken &&
      selectedToken.address.toLowerCase() === next.address.toLowerCase() &&
      selectedToken.decimals === next.decimals &&
      selectedToken.symbol === next.symbol
    ) {
      return;
    }
    setSelectedToken({ ...next });
  }, [selectedSucker?.peerChainId, baseTokenInfo.symbol, baseTokenInfo.tokenMap, selectedToken]);

  const { token } = useJBTokenContext();
  const { address } = useAccount();
  const [memo, setMemo] = useState<string>();
  const [resetKey, setResetKey] = useState(0);

  const [amountA, setAmountA] = useState<string>("");
  const [amountB, setAmountB] = useState<string>("");
  const [amountC, setAmountC] = useState<string>("");

  const primaryNativeTerminal = {
    data: "0xdb9644369c79c3633cde70d2df50d827d7dc7dbc",
  };
  const { ruleset, rulesetMetadata } = useJBRulesetContext();
  const tokenB = token?.data;
  const [baseTokenAmountWei, setBaseTokenAmountWei] = useState<bigint | null>(null);

  // Top-level balance hook for project base token on selected network
  const chainIdNum = selectedSucker?.peerChainId
    ? Number(selectedSucker.peerChainId)
    : undefined;
  const baseTokenAddress = chainIdNum
    ? (baseTokenInfo.tokenMap as any)[chainIdNum]?.token
    : undefined;
  const isNativeBase =
    !baseTokenAddress ||
    baseTokenAddress.toLowerCase() === NATIVE_TOKEN.toLowerCase() ||
    baseTokenAddress.toLowerCase() === "0x000000000000000000000000000000000000eeee";
  const baseTokenBalance = useBalance({
    address,
    chainId: chainIdNum,
    token: isNativeBase ? undefined : (baseTokenAddress as `0x${string}`),
    query: { enabled: Boolean(address && chainIdNum) },
  });
  // logs removed

  // Paying only in base token; identity conversion
  const toBaseWei = (amountInSelectedWei: bigint): bigint => amountInSelectedWei;

  // Recompute quotes if the selected pay-with token changes and there is an input
  useEffect(() => {
    if (!amountA) return;
    if (!ruleset?.data || !rulesetMetadata?.data) return;
    if (!tokenB || !selectedToken) return;

    const sel = selectedToken as { decimals: number };
    const value = parseUnits(`${parseFloat(amountA)}` as `${number}`, sel.decimals);
    const baseWei = value;
    setBaseTokenAmountWei(baseWei);

    const amountBQuote = getTokenAToBQuote(new FixedInt(baseWei, sel.decimals), {
      weight: ruleset.data.weight,
      reservedPercent: rulesetMetadata.data.reservedPercent,
    });
    setAmountB(formatUnits(amountBQuote.payerTokens, tokenB.decimals));
    setAmountC(formatUnits(amountBQuote.reservedTokens, tokenB.decimals));
  }, [selectedToken, amountA, ruleset?.data, rulesetMetadata?.data, tokenB]);

  if (
    token.isLoading ||
    ruleset.isLoading ||
    rulesetMetadata.isLoading ||
    !tokenB ||
    !selectedToken
  ) {
    return "Loading...";
  }
  const _amountA = {
    amount: new FixedInt(
      parseUnits(amountA, selectedToken!.decimals),
      selectedToken!.decimals,
    ), // ✅ Use correct decimals
    symbol: selectedToken!.symbol,
  };
  const _amountB = {
    amount: new FixedInt(parseEther(amountB), tokenB.decimals),
    symbol: formatTokenSymbol(tokenB.symbol),
  };
  const _amountC = {
    amount: new FixedInt(parseEther(amountC || "0"), tokenB.decimals),
    symbol: formatTokenSymbol(token),
  };

  function resetForm() {
    setAmountA("");
    setAmountB("");
    setAmountC("");
    setResetKey((prev) => prev + 1); // Force PayDialog to remount
  }

  

  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <PayInput
          withPayOnSelect
          label="Pay"
          type="number"
          className="border-b border-l border-r border-t border-zinc-200 relative z-[50]"
          onChange={(e) => {
            const valueRaw = e.target.value;
            setAmountA(valueRaw);

            if (!valueRaw) {
              resetForm();
              return;
            }

            if (!ruleset?.data || !rulesetMetadata?.data) return;

            const sel2 = selectedToken as { decimals: number };
            const value = parseUnits(`${parseFloat(valueRaw)}` as `${number}`, sel2.decimals);
            const baseWei = toBaseWei(value);
            setBaseTokenAmountWei(baseWei);

            const amountBQuote = getTokenAToBQuote(
              new FixedInt(baseWei, sel2.decimals),
              {
                weight: ruleset.data.weight,
                reservedPercent: rulesetMetadata.data.reservedPercent,
              },
            );

            setAmountB(formatUnits(amountBQuote.payerTokens, tokenB.decimals));
            setAmountC(formatUnits(amountBQuote.reservedTokens, tokenB.decimals));
          }}
          value={amountA}
          currency={(() => {
            const isErc20 = Boolean(baseTokenAddress);
            const valueWei = baseTokenBalance.data?.value;
            const baseSymbol = baseTokenInfo.tokenType === "USDC" ? "USDC" : "ETH";
            return (
              <span className="px-3 text-right leading-tight">
                <span className="block text-zinc-600">{baseSymbol}</span>
                <span className="block text-[11px] text-zinc-500">
                  {valueWei === undefined
                    ? "..."
                    : isErc20
                    ? formatUnitsJB(
                        valueWei,
                        ((baseTokenInfo.tokenMap as any)[chainIdNum!]?.decimals ?? 18),
                        { fractionDigits: 4 }
                      )
                    : // Native token: reuse NativeTokenValue and force 6 decimals
                      (
                        <NativeTokenValue wei={valueWei} decimals={6} />
                      )}
                </span>
              </span>
            );
          })()}
        />
        <PayInput
          label="You get"
          type="number"
          className="border-l border-r border-zinc-200"
          onChange={(e) => {
            const valueRaw = e.target.value;
            setAmountB(valueRaw);

            if (!valueRaw) {
              resetForm();
              return;
            }

            const value = FixedInt.parse(valueRaw, tokenB.decimals);

            if (!ruleset?.data || !rulesetMetadata?.data) return;

            const amountAQuote = getTokenBtoAQuote(
              value,
              selectedToken.decimals,
              {
                weight: ruleset.data.weight,
                reservedPercent: rulesetMetadata.data.reservedPercent,
              },
            );

            setAmountA(amountAQuote.format());
          }}
          value={amountB}
          currency={formatTokenSymbol(tokenB.symbol)}
        />
        <div className="text-md flex w-full gap-1 overflow-x-auto whitespace-nowrap border-l border-r border-zinc-300 bg-zinc-200 p-3 text-zinc-700">
          Splits get {amountC || 0} {formatTokenSymbol(tokenB.symbol)}
        </div>
      </div>

      <div className="flex flex-row">
        <Formik initialValues={{}} onSubmit={() => {}}>
          <Field
            component="textarea"
            id="memo"
            name="memo"
            rows={2}
            className={
              "text-md file:text-md z-10 flex w-full border border-zinc-200 bg-white px-3 py-1.5 ring-offset-white file:border-0 file:bg-transparent file:font-medium placeholder:text-zinc-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
            }
            onChange={(e: any) => setMemo?.(e.target.value)}
            placeholder="Leave a note"
          />
        </Formik>
        <div className="flex w-[150px]">
          {primaryNativeTerminal?.data ? (
            <PayDialog
              key={resetKey}
              amountA={_amountA}
              amountB={_amountB}
              splitsAmount={_amountC}
              memo={memo}
              paymentToken={selectedToken.address}
              baseTokenAmountWei={baseTokenAmountWei ?? undefined}
              peerChainId={selectedSucker?.peerChainId}
              disabled={!amountA}
              onSuccess={() => {
                resetForm();
                setMemo("");
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
