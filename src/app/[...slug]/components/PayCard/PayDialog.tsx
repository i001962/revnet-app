import { ButtonWithWallet } from "@/components/ButtonWithWallet";
import { ChainLogo } from "@/components/ChainLogo";
import { TokenAmount } from "@/components/TokenAmount";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
// Selection UI moved to PayForm
import { Stat } from "@/components/ui/stat";
import { useToast } from "@/components/ui/use-toast";
import {
  JB_CHAINS,
  JBChainId,
  NATIVE_TOKEN,
  TokenAmountType,
} from "juice-sdk-core";
import {
  useJBChainId,
  useJBContractContext,
  useJBProjectMetadataContext,
  useSuckers,
  useWriteJbMultiTerminalPay,
  useWriteJbSwapTerminalPay,
  useReadJbSwapTerminalTokenOut,
  useReadJbSwapTerminalGetPoolFor,
} from "juice-sdk-react";
import { USDC_ADDRESSES, SUPPORTED_TOKENS } from "@/app/constants";
import { useProjectBaseToken } from "@/hooks/useProjectBaseToken";
import { useEffect, useState } from "react";
import { Address, erc20Abi } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  usePublicClient,
  useWalletClient,
  useBalance,
} from "wagmi";
import { useSelectedSucker } from "./SelectedSuckerContext";
import { useBendystrawQuery } from "@/graphql/useBendystrawQuery";
import { ProjectDocument, SuckerGroupDocument } from "@/generated/graphql";
import { grantSwapPoolPermission } from "@/lib/permissions";
import { addDefaultPool } from "@/lib/swapPools";
import { useReadRevDeployerPermissions } from "revnet-sdk";
import { Label } from "@/components/ui/label";

export function PayDialog({
  amountA,
  amountB,
  splitsAmount,
  memo,
  paymentToken,
  baseTokenAmountWei,
  peerChainId,
  disabled,
  onSuccess,
}: {
  amountA: TokenAmountType;
  amountB: TokenAmountType;
  splitsAmount?: TokenAmountType;
  memo: string | undefined;
  paymentToken: `0x${string}`;
  baseTokenAmountWei?: bigint;
  peerChainId?: JBChainId;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const { projectId } = useJBContractContext();
  const primaryNativeTerminal = {
    data: "0xdb9644369c79c3633cde70d2df50d827d7dc7dbc",
  };
  const { address } = useAccount();
  const value = amountA.amount.value;
  const {
    isError,
    error,
    writeContract,
    isPending: isWriteLoading,
    data,
  } = useWriteJbMultiTerminalPay();
  const {
    writeContract: writeSwapContract,
    isPending: isSwapWriteLoading,
  } = useWriteJbSwapTerminalPay();
  const chainId = useJBChainId();
  const { selectedSucker, setSelectedSucker } = useSelectedSucker();
  const txHash = data;
  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const { toast } = useToast();
  const suckersQuery = useSuckers();
  const suckers = suckersQuery.data;
  const publicClient = usePublicClient({ chainId: selectedSucker?.peerChainId as number | undefined });
  const { data: walletClient } = useWalletClient();
  const [isApproving, setIsApproving] = useState(false);
  // All selections are controlled by PayForm

  // Project base token map (per chain)
  const baseInfo = useProjectBaseToken();
  // Contracts context (avoid hardcoded addresses)
  const { contracts } = useJBContractContext();
  // Project metadata (for name)
  const { metadata } = useJBProjectMetadataContext();

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
  // Resolve project name (from subgraph); fallback to ID if unavailable
  const projectName: string =
    (metadata?.data as any)?.name ||
    (projectData?.project as any)?.name ||
    `Project #${String(projectId)}`;


  const { data: tokenOut } = useReadJbSwapTerminalTokenOut({
    chainId: selectedSucker?.peerChainId as JBChainId | undefined,
  }); 
  // Default pool for (projectId, tokenIn) via SDK (no hardcoded swap terminal address for logic checks)
  const projectIdForPool = selectedSucker ? (BigInt(selectedSucker.projectId as unknown as string) || 0n) : 0n;
  const { data: poolForData } = useReadJbSwapTerminalGetPoolFor({
    chainId: selectedSucker?.peerChainId as JBChainId | undefined,
    args: [projectIdForPool, paymentToken],
    query: { enabled: Boolean(selectedSucker?.peerChainId && paymentToken) },
  });
  // Get the correct token address for the selected chain
  const getTokenForChain = (targetChainId: number) => {
    if (paymentToken.toLowerCase() === NATIVE_TOKEN.toLowerCase()) {
      return NATIVE_TOKEN;
    }

    const usdcAddressesLower = Object.values(USDC_ADDRESSES).map((addr) =>
      addr.toLowerCase(),
    );
    if (
      usdcAddressesLower.includes(paymentToken.toLowerCase() as `0x${string}`)
    ) {
      return USDC_ADDRESSES[targetChainId] || paymentToken;
    }

    if (!suckerGroupData?.suckerGroup?.projects?.items) {
      return paymentToken; // fallback to original paymentToken
    }

    const projectForChain = suckerGroupData.suckerGroup.projects.items.find(
      (project) => project.chainId === targetChainId,
    );

    if (projectForChain?.token) {
      return projectForChain.token as `0x${string}`;
    }

    return paymentToken; // fallback to original paymentToken
  };

  // Chain context used for routing and addresses
  const effectivePeerChainId = peerChainId || selectedSucker?.peerChainId || chainId;

  // Balance line item component to safely use hooks per item
  const BalanceLine = ({ tokenAddr }: { tokenAddr: `0x${string}` }) => {
    const bal = useBalance({
      address,
      chainId: Number(effectivePeerChainId),
      token: tokenAddr.toLowerCase() === NATIVE_TOKEN.toLowerCase() ? undefined : tokenAddr,
      query: { enabled: Boolean(address && effectivePeerChainId) },
    });
    return <span className="text-xs text-zinc-500">{bal.data?.formatted ?? "0.00"}</span>;
  };

  // Auto-reset after successful payment
  useEffect(() => {
    if (isSuccess && onSuccess) {
      const timer = setTimeout(() => {
        onSuccess();
      }, 3000); // Show success message for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isSuccess, onSuccess]);

  useEffect(() => {
    if (isError && error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message ||
          "An error occurred while processing your contribution",
      });
    }
  }, [isError, error, toast]);

  useEffect(() => {
    if (chainId && suckers && !suckers.find((s) => s.peerChainId === chainId)) {
      suckers.push({ peerChainId: chainId, projectId });
    }
    if (suckers && !selectedSucker) {
      const i = suckers.findIndex((s) => s.peerChainId === chainId);
      setSelectedSucker(suckers[i]);
    }
  }, [suckers, chainId, projectId, selectedSucker, setSelectedSucker]);

  const loading = isWriteLoading || isSwapWriteLoading || isTxLoading || isApproving;

  // Resolve operator (swap terminal on this chain) and JBPermissions contract
  const operatorAddress = (contracts as any)?.swapTerminal?.data as `0x${string}` | undefined;
  const { data: permissionsAddress } = useReadRevDeployerPermissions({
    chainId: selectedSucker?.peerChainId as JBChainId | undefined,
  });

  const handlePay = async () => {
    if (
      !primaryNativeTerminal?.data ||
      !address ||
      !selectedSucker ||
      !paymentToken ||
      !walletClient ||
      !publicClient
    )
      return;

    // Determine base token for this project on the selected chain (from baseInfo tokenMap)
    const baseTokenForChain =
      baseInfo.tokenMap[
        Number(selectedSucker.peerChainId) as JBChainId
      ]?.token || NATIVE_TOKEN;

    // Always use the project's base token for payment (swaps disabled)
    const chainToken = baseTokenForChain;
    const isNative =
      chainToken.toLowerCase() === NATIVE_TOKEN.toLowerCase() ||
      chainToken.toLowerCase() === "0x000000000000000000000000000000000000eeee";

    // amountA.amount.value is already expressed in the currently selected token's decimals.
    // Do NOT rescale by decimals here; send exactly what the user entered for the selected token.
    const amountToSpend = value;

    // Swaps disabled → never swap
    const needsSwap = false;
    const terminalAddress = needsSwap
      ? (((contracts as any)?.swapTerminal?.data as `0x${string}`) ?? undefined)
      : (primaryNativeTerminal.data as `0x${string}`);

    // If swapping, ensure a default pool exists (project-specific or global)
    if (needsSwap) {
      const defaultPool = Array.isArray(poolForData) ? (poolForData[0] as `0x${string}` | undefined) : undefined;
      if (!defaultPool || defaultPool === "0x0000000000000000000000000000000000000000") {
        toast({
          variant: "destructive",
          title: "No default pool configured",
          description:
            "This project has no default pool for the selected token on this chain. Add a default pool or pay with the project's base token.",
        });
        return;
      }
    }

    // Per JBSwapTerminal docs: token is the token being paid in.
    // - For swap terminal, tokenArg MUST be the user's payment token (chainToken).
    // - For native, pass 0xeeee... and set value; amount should be 0.
    const tokenArg: `0x${string}` = chainToken;

    try {
      if (!isNative) {
        const allowance = await publicClient.readContract({
          address: chainToken,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, terminalAddress!],
        });

        if (BigInt(allowance) < BigInt(amountToSpend)) {
          setIsApproving(true);
          const hash = await walletClient.writeContract({
            address: chainToken,
            abi: erc20Abi,
            functionName: "approve",
            args: [terminalAddress, amountToSpend],
          });
          await publicClient.waitForTransactionReceipt({ hash });
          setIsApproving(false);
        }
      }

      // Dry-run to catch missing default pool / token acceptance issues before sending
/*       try {
        const amountArg = isNative ? 0n : amountToSpend;
        await publicClient.simulateContract({
          address: terminalAddress,
          abi: [
            {
              name: "pay",
              type: "function",
              stateMutability: "payable",
              inputs: [
                { name: "projectId", type: "uint256" },
                { name: "token", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "beneficiary", type: "address" },
                { name: "minReturnedTokens", type: "uint256" },
                { name: "memo", type: "string" },
                { name: "metadata", type: "bytes" },
              ],
              outputs: [{ name: "", type: "bytes32" }],
            },
          ],
          functionName: "pay",
          args: [
            selectedSucker.projectId,
            tokenArg,
            amountArg,
            address,
            0n,
            memo || "",
            "0x",
          ],
          value: isNative ? amountToSpend : 0n,
          account: address,
        });
      } catch (simErr) {
        const msg = simErr instanceof Error ? simErr.message : String(simErr);
        if (msg.toLowerCase().includes("nodefaultpooldefined") || msg.toLowerCase().includes("wrongpool") || msg.toLowerCase().includes("tokennotaccepted")) {
          toast({
            variant: "destructive",
            title: "Swap unavailable",
            description: "This project has no default pool for this token on the selected chain. Switch 'Pay with' to the project's base token (e.g., USDC) or ask the project to configure a default pool.",
          });
          return;
        }
        // Unknown simulation failure
        toast({ variant: "destructive", title: "Simulation failed", description: msg });
        return;
      } */

      if (!needsSwap) {
        // Fallback to existing hook for primary terminal; it will be value 0 unless base is native
        writeContract?.({
          chainId: selectedSucker.peerChainId,
          address: terminalAddress,
          args: [
            selectedSucker.projectId,
            tokenArg,
            isNative ? 0n : amountToSpend,
            address,
            0n,
            memo || "",
            "0x",
          ],
          value: isNative ? amountToSpend : 0n,
        });
      } else {
        toast({
          title: "Swaps temporarily disabled",
          description: "Pay with the project's base token only.",
          variant: "destructive",
        });
        return;
      }
    } catch (err) {
      setIsApproving(false);
      const errMsg =
        err instanceof Error ? err.message : "Unknown error during payment";
      console.error("Payment failed:", err);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: errMsg,
      });
    }
  };

  return (
    <Dialog open={disabled === true ? false : undefined}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          className="w-full bg-teal-500 hover:bg-teal-600"
        >
          Pay
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogDescription>
            <div>
              {isSuccess ? (
                <div>Success! You can close this window.</div>
              ) : (
                <>
                  {/* Hidden summary block to reduce redundancy; kept for future use */}
                  <div className="hidden flex-col gap-6">
                    <Stat label="Pay">
                      <TokenAmount amount={amountA} />
                    </Stat>
                    <Stat label="Get">
                      <TokenAmount amount={amountB} />
                    </Stat>
                    {splitsAmount && (
                      <Stat label="Splits get">
                        <TokenAmount amount={splitsAmount} />
                      </Stat>
                    )}
                    {memo && <Stat label="Memo">{memo}</Stat>}
                  </div>
                  {isTxLoading ? (
                    <div>Transaction submitted, awaiting confirmation...</div>
                  ) : null}
                </>
              )}
            </div>
          </DialogDescription>
          {!isSuccess ? (
            <div className="flex flex-row items-end justify-between">
              <div className="mt-4 flex flex-col gap-3">
                <Label className="text-zinc-900">Confirm payment</Label>
                <div className="grid w-[260px] gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Project</span>
                    <span className="font-medium">{projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Project ID</span>
                    <span className="font-medium">{String(projectId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Network</span>
                    <span className="font-medium">{effectivePeerChainId ? JB_CHAINS[effectivePeerChainId as JBChainId].name : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">You pay</span>
                    <span className="font-medium"><TokenAmount amount={amountA} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">You receive</span>
                    <span className="font-medium"><TokenAmount amount={amountB} /></span>
                  </div>
                </div>
                {/* Admin utilities hidden (permission grant, add default pool) */}
                <div className="hidden justify-end gap-2">
                  <Button
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    onClick={async () => {
                      if (!walletClient || !address) return;
                      try {
                        if (!operatorAddress || !permissionsAddress) {
                          toast({
                            variant: "destructive",
                            title: "Missing setup",
                            description: "Operator or permissions contract unknown on this chain.",
                          });
                          return;
                        }
                        await grantSwapPoolPermission({
                          walletClient,
                          account: address,
                          permissionsContract: permissionsAddress as `0x${string}`,
                          operator: operatorAddress as `0x${string}`,
                          projectId: 0n, // global default; pass selectedSucker.projectId for scoped
                        });
                        toast({ title: "Permission granted" });
                      } catch (err) {
                        console.error("Permission grant failed", err);
                        toast({ variant: "destructive", title: "Permission grant failed" });
                      }
                    }}
                  >
                    Grant swap-pool permission
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    onClick={async () => {
                      if (!walletClient || !address) return;
                      try {
                        if (!selectedSucker?.peerChainId) return;
                        const swapTerminal = (contracts as any)?.swapTerminal?.data as `0x${string}` | undefined;
                        if (!swapTerminal) { toast({ variant: "destructive", title: "Swap terminal unavailable on this chain" }); return; }
                        // Hardcode Base mainnet WETH/USDC 0.05% pool from your note
                        const pool = "0x6c6Bc977E13Df9b0de53b251522280BB72383700" as `0x${string}`;
                        // Token for default pool: use canonical native placeholder casing per your guidance
                        const token = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as `0x${string}`;
                        await addDefaultPool({
                          walletClient,
                          account: address,
                          swapTerminal,
                          projectId: BigInt(selectedSucker.projectId),
                          token,
                          pool,
                        });
                        toast({ title: "Default pool added" });
                      } catch (err) {
                        console.error("Add default pool failed", err);
                        toast({ variant: "destructive", title: "Add default pool failed" });
                      }
                    }}
                  >
                    Add default pool
                  </Button>
                </div>
              </div>
              <ButtonWithWallet
                targetChainId={
                  selectedSucker?.peerChainId as JBChainId | undefined
                }
                loading={loading}
                onClick={handlePay}
                className="bg-teal-500 hover:bg-teal-600"
              >
                {paymentToken.toLowerCase() === NATIVE_TOKEN.toLowerCase() ? "Pay" : isApproving ? "Approving..." : "Approve & Pay"}
              </ButtonWithWallet>
            </div>
          ) : null}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
