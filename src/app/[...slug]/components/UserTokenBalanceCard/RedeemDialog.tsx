import { ButtonWithWallet } from "@/components/ButtonWithWallet";
import { ChainLogo } from "@/components/ChainLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FixedInt } from "fpnum";
import {
  DEFAULT_METADATA,
  JB_CHAINS,
  JBProjectToken,
  NATIVE_TOKEN,
  NATIVE_TOKEN_DECIMALS,
  formatUnits,
} from "juice-sdk-core";
import {
  JBChainId,
  useJBChainId,
  useJBTokenContext,
  useSuckersUserTokenBalance,
  useTokenCashOutQuoteEth,
  useWriteJbMultiTerminalCashOutTokensOf,
} from "juice-sdk-react";
import { PropsWithChildren, useState, useEffect } from "react";
import { Address, erc20Abi } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { useBendystrawQuery } from "@/graphql/useBendystrawQuery";
import { ProjectDocument, SuckerGroupDocument } from "@/generated/graphql";
import {
  createTokenConfigGetter,
  getTokenSymbolFromAddress,
} from "@/lib/tokenUtils";

export function RedeemDialog({
  projectId,
  creditBalance: _creditBalance,
  tokenSymbol,
  primaryTerminalEth,
  disabled,
  children,
}: PropsWithChildren<{
  creditBalance: FixedInt<number>;
  tokenSymbol: string;
  projectId: bigint;
  primaryTerminalEth: Address;
  disabled?: boolean;
}>) {
  const [redeemAmount, setRedeemAmount] = useState<string>();
  // const {
  //   contracts: { primaryNativeTerminal },
  // } = useJBContractContext();
  const primaryNativeTerminal = {
    data: "0xdb9644369c79c3633cde70d2df50d827d7dc7dbc",
  };
  const { address } = useAccount();
  const { data: balances } = useSuckersUserTokenBalance();
  const [cashOutChainId, setCashOutChainId] = useState<string>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const chainId = useJBChainId();
  const [isApproving, setIsApproving] = useState(false);
  const { toast } = useToast();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { token } = useJBTokenContext();

  // Set default chain and redeem amount when dialog opens
  useEffect(() => {
    if (!isDialogOpen || !balances || balances.length === 0) return;
    const initialChain = cashOutChainId ?? balances[0].chainId.toString();
    setCashOutChainId(initialChain);
    const balance = balances.find((b) => b.chainId === Number(initialChain));
    setRedeemAmount(balance ? balance.balance.format() : undefined);
  }, [isDialogOpen, balances]);

  // Update redeem amount when switching chains
  useEffect(() => {
    if (!isDialogOpen || !balances) return;
    const balance = balances.find((b) => b.chainId === Number(cashOutChainId));
    setRedeemAmount(balance ? balance.balance.format() : undefined);
  }, [cashOutChainId, balances, isDialogOpen]);

  const selectedBalance = balances?.find(
    (b) => b.chainId === Number(cashOutChainId),
  );

  // Determine correct project ID based on selected chain
  const effectiveProjectId = selectedBalance?.projectId
    ? BigInt(selectedBalance.projectId)
    : projectId;

  // Get the suckerGroupId from the current project
  const { data: projectData } = useBendystrawQuery(
    ProjectDocument,
    {
      chainId: Number(chainId),
      projectId: Number(projectId),
    },
    {
      enabled: !!chainId && !!projectId,
    },
  );
  const suckerGroupId = projectData?.project?.suckerGroupId;

  // Get all projects in the sucker group with their token data
  const { data: suckerGroupData } = useBendystrawQuery(
    SuckerGroupDocument,
    {
      id: suckerGroupId ?? "",
    },
    {
      enabled: !!suckerGroupId,
    },
  );

  // Create a token config getter for the sucker group
  const getTokenConfig = createTokenConfigGetter(suckerGroupData);

  // Get token configuration for the selected chain
  const {
    token: selectedChainToken,
    decimals: quoteDecimals,
  } = getTokenConfig(Number(cashOutChainId ?? chainId ?? 0));

  const isNative =
    selectedChainToken.toLowerCase() === NATIVE_TOKEN.toLowerCase();

  // Determine what token to receive from cashout
  // For ETH projects: receive ETH (NATIVE_TOKEN)
  // For USDC projects: receive USDC (the project's base token)
  const tokenToReceive = isNative ? NATIVE_TOKEN : selectedChainToken;

  const quoteTokenSymbol = getTokenSymbolFromAddress(selectedChainToken);
  const currencySymbol =
    quoteTokenSymbol === "USDC" ? "USD" : quoteTokenSymbol;

  // Use project token decimals, not base token decimals
  const projectTokenDecimals = token?.data?.decimals || NATIVE_TOKEN_DECIMALS;

  const redeemAmountBN = redeemAmount
    ? JBProjectToken.parse(redeemAmount, projectTokenDecimals).value
    : 0n;

  const {
    writeContract,
    isPending: isWriteLoading,
    data,
  } = useWriteJbMultiTerminalCashOutTokensOf();

  const txHash = data;
  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { data: redeemQuote } = useTokenCashOutQuoteEth(
    redeemAmountBN,
    {
      chainId: (
        cashOutChainId ? Number(cashOutChainId) : chainId
      ) as JBChainId,
      projectId: Number(effectiveProjectId),
    } as any,
  );

  const loading = isWriteLoading || isTxLoading;
  const valid =
    redeemAmountBN > 0n &&
    (selectedBalance?.balance.value ?? 0n) >= redeemAmountBN;

  return (
    <Dialog
      open={disabled ? false : isDialogOpen}
      onOpenChange={setIsDialogOpen}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cash out</DialogTitle>
          <DialogDescription>
            <div className="my-4">
              {isSuccess ? (
                <div>Success! You can close this window.</div>
              ) : (
                <>
                  <div className="mb-5 w-[65%]">
                    <span className="text-sm font-medium text-black">
                      {" "}
                      Your {tokenSymbol}
                    </span>
                    <div className="mt-1 border border-zinc-200 bg-zinc-50 p-3">
                      {balances?.map((balance, index) => (
                        <div key={index} className="flex justify-between gap-2">
                          {JB_CHAINS[balance.chainId as JBChainId].name}
                          <span className="font-medium">
                            {balance.balance?.format(6)} {tokenSymbol}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="amount" className="text-zinc-900">
                      Cash out amount
                    </Label>
                    <div className="grid grid-cols-7 gap-2">
                      <div className="col-span-4">
                        <div className="relative">
                          <Input
                            id="amount"
                            name="amount"
                            value={redeemAmount}
                            onChange={(e) => setRedeemAmount(e.target.value)}
                          />
                          <div
                            className={
                              "pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center px-3"
                            }
                          >
                            <span className="sm:text-md text-zinc-500">
                              {tokenSymbol}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={cashOutChainId}
                          onValueChange={(v) => setCashOutChainId(v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select chain" />
                          </SelectTrigger>
                          <SelectContent>
                            {balances
                              ?.filter((b) => b.balance.value > 0n)
                              .map((balance) => {
                                return (
                                  <SelectItem
                                    value={balance.chainId.toString()}
                                    key={balance.chainId}
                                  >
                                    <div className="flex items-center gap-2">
                                      <ChainLogo
                                        chainId={balance.chainId as JBChainId}
                                      />
                                      {
                                        JB_CHAINS[balance.chainId as JBChainId]
                                          .name
                                      }
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {redeemAmount && cashOutChainId && !valid ? (
                    <div className="mt-4 text-red-500">
                      Insuffient {tokenSymbol} on{" "}
                      {JB_CHAINS[Number(cashOutChainId) as JBChainId].name}
                    </div>
                  ) : null}

                  {redeemAmount && redeemAmountBN > 0n && valid ? (
                    <div className="mt-4 text-base">
                      You'll get ~{" "}
                      {redeemQuote ? (
                        <span className="font-medium">
                          {Number(
                            formatUnits(
                              (redeemQuote * 975n) / 1000n,
                              quoteDecimals,
                            ),
                          ).toLocaleString("en-US", {
                            minimumFractionDigits:
                              currencySymbol === "USD" ? 2 : 0,
                            maximumFractionDigits:
                              currencySymbol === "USD" ? 2 : 4,
                          })}{" "}
                          {currencySymbol}
                        </span>
                      ) : (
                        <>...</>
                      )}
                    </div>
                  ) : null}

                  {isTxLoading ? (
                    <div>Transaction submitted, awaiting confirmation...</div>
                  ) : null}
                </>
              )}
            </div>
          </DialogDescription>
          <DialogFooter>
            {!isSuccess ? (
              <ButtonWithWallet
                targetChainId={(
                  cashOutChainId ? Number(cashOutChainId) : chainId
                ) as JBChainId}
                loading={loading || isApproving}
                onClick={async () => {
                  if (
                    !primaryNativeTerminal?.data ||
                    !address ||
                    !redeemAmountBN ||
                    !walletClient ||
                    !publicClient
                  ) {
                    console.error("Missing required data for cashout");
                    return;
                  }

                  try {
                    // Check allowance for the project token (what we're redeeming)
                    // We need allowance regardless of whether the project is ETH or USDC based
                    // The project token address should come from the token context, not the base token
                    const projectTokenAddress =
                      token?.data?.address || selectedChainToken;
                    const allowance = await publicClient.readContract({
                      address: projectTokenAddress,
                      abi: erc20Abi,
                      functionName: "allowance",
                      args: [
                        address,
                        primaryNativeTerminal.data as `0x${string}`,
                      ],
                    });

                    if (BigInt(allowance) < redeemAmountBN) {
                      setIsApproving(true);
                      const hash = await walletClient.writeContract({
                        address: projectTokenAddress,
                        abi: erc20Abi,
                        functionName: "approve",
                        args: [
                          primaryNativeTerminal.data as `0x${string}`,
                          redeemAmountBN,
                        ],
                      });
                      await publicClient.waitForTransactionReceipt({ hash });
                      setIsApproving(false);
                    }

                    const args = [
                      address, // holder
                      effectiveProjectId, // project id (use the correct project ID for the selected chain)
                      redeemAmountBN, // cash out count
                      tokenToReceive, // token to reclaim (what you want to receive)
                      0n, // min tokens reclaimed
                      address, // beneficiary
                      DEFAULT_METADATA, // metadata
                    ] as const;

                    writeContract?.({
                      chainId: (
                        cashOutChainId ? Number(cashOutChainId) : chainId
                      ) as JBChainId,
                      address: primaryNativeTerminal.data as `0x${string}`,
                      args,
                    });
                  } catch (err) {
                    setIsApproving(false);
                    const errMsg =
                      err instanceof Error
                        ? err.message
                        : "Unknown error during cashout";
                    console.error("Cashout failed:", err);
                    toast({
                      variant: "destructive",
                      title: "Cashout Failed",
                      description: errMsg,
                    });
                  }
                }}
              >
                {isApproving ? "Approving..." : "Cash out"}
              </ButtonWithWallet>
            ) : null}
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
