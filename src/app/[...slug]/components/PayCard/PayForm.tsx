import { FixedInt } from "fpnum";
import { getTokenAToBQuote, getTokenBtoAQuote } from "juice-sdk-core";
import { Field, Formik } from "formik";
import { useJBRulesetContext, useJBTokenContext } from "juice-sdk-react";
import { useEffect, useState } from "react";
import { formatUnits, parseEther, parseUnits } from "viem";
import { PayDialog } from "./PayDialog";
import { PayInput } from "./PayInput";
import { formatTokenSymbol } from "@/lib/utils";
import {
  useAvailablePaymentTokens,
  PaymentToken,
} from "@/hooks/useAvailablePaymentTokens";
import { useProjectBaseToken } from "@/hooks/useProjectBaseToken";
import { SelectPaymentToken } from "./SelectPaymentToken";

export function PayForm() {
  const availableTokens = useAvailablePaymentTokens();
  const baseTokenInfo = useProjectBaseToken();
  const [selectedToken, setSelectedToken] = useState<PaymentToken>(
    availableTokens[0],
  );
  useEffect(() => {
    const defaultSymbol = baseTokenInfo.tokenType === "USDC" ? "USDC" : "ETH";
    const defaultToken =
      availableTokens.find((t) => t.symbol === defaultSymbol) ||
      availableTokens[0];
    setSelectedToken(defaultToken);
  }, [baseTokenInfo, availableTokens]);

  const { token } = useJBTokenContext();
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

  if (
    token.isLoading ||
    ruleset.isLoading ||
    rulesetMetadata.isLoading ||
    !tokenB
  ) {
    return "Loading...";
  }
  const _amountA = {
    amount: new FixedInt(
      parseUnits(amountA, selectedToken.decimals),
      selectedToken.decimals,
    ), // ✅ Use correct decimals
    symbol: selectedToken.symbol,
  };
  const _amountB = {
    amount: new FixedInt(parseEther(amountB), tokenB.decimals),
    symbol: formatTokenSymbol(token),
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
          className="border-b border-l border-r border-t border-zinc-200"
          onChange={(e) => {
            const valueRaw = e.target.value;
            setAmountA(valueRaw);

            if (!valueRaw) {
              resetForm();
              return;
            }

            if (!ruleset?.data || !rulesetMetadata?.data) return;

            const value = parseUnits(
              `${parseFloat(valueRaw)}` as `${number}`,
              selectedToken.decimals,
            );
            const amountBQuote = getTokenAToBQuote(
              new FixedInt(value, selectedToken.decimals),
              {
                weight: ruleset.data.weight,
                reservedPercent: rulesetMetadata.data.reservedPercent,
              },
            );

            setAmountB(formatUnits(amountBQuote.payerTokens, tokenB.decimals));
            setAmountC(
              formatUnits(amountBQuote.reservedTokens, tokenB.decimals),
            );
          }}
          value={amountA}
          currency={
            <SelectPaymentToken
              tokens={availableTokens}
              value={selectedToken}
              onChange={setSelectedToken}
            />
          }
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
          currency={formatTokenSymbol(token)}
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
