import {
  useJBChainId,
  useJBContractContext,
  useJBRulesetContext,
  useJBTokenContext,
  useReadJbControllerPendingReservedTokenBalanceOf,
  useReadJbSplitsSplitsOf,
  useSuckers,
} from "juice-sdk-react";
import {
  ChainIdToChain,
  RESERVED_TOKEN_SPLIT_GROUP_ID,
  chainNames,
} from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import { ForwardIcon } from "@heroicons/react/24/solid";
import { EthereumAddress } from "@/components/EthereumAddress";
import { useBoostRecipient } from "@/hooks/useBoostRecipient";
import EtherscanLink from "@/components/EtherscanLink";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  JBChainId,
  formatUnits,
  jbProjectDeploymentAddresses,
} from "juice-sdk-core";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChainLogo } from "@/components/ChainLogo";
import { formatTokenSymbol } from "@/lib/utils";
import { Address } from "viem";

type Sucker = {
  peerChainId: JBChainId;
  projectId: bigint;
};

export function SplitsSection() {
  const { projectId } = useJBContractContext();
  const chainId = useJBChainId();
  const { ruleset } = useJBRulesetContext();
  const { token } = useJBTokenContext();
  const boostRecipient = useBoostRecipient();
  const [selectedSucker, setSelectedSucker] = useState<Sucker>();
  const { data: suckers } = useSuckers() as { data: Sucker[] };
  const { data: reservedTokenSplits, isLoading } = useReadJbSplitsSplitsOf({
    chainId: selectedSucker?.peerChainId,
    args:
      ruleset && ruleset?.data
        ? [projectId, BigInt(ruleset.data.id), RESERVED_TOKEN_SPLIT_GROUP_ID]
        : undefined,
  });
  const { data: pendingReserveTokenBalance } =
    useReadJbControllerPendingReservedTokenBalanceOf({
      chainId: selectedSucker?.peerChainId,
      address: selectedSucker?.peerChainId
        ? (jbProjectDeploymentAddresses.JBController[
          selectedSucker?.peerChainId
        ] as Address)
        : undefined,
      args: ruleset && ruleset?.data ? [projectId] : undefined,
    });
  console.log("reserveToken", pendingReserveTokenBalance);
  useEffect(() => {
    if (chainId && suckers && !suckers.find((s) => s.peerChainId === chainId)) {
      suckers.push({ projectId, peerChainId: chainId });
    }
    if (suckers && !selectedSucker) {
      const i = suckers.findIndex((s) => s.peerChainId === chainId);
      setSelectedSucker(suckers[i]);
    }
  }, [suckers, chainId, projectId, selectedSucker]);

  return (
    <>
      <div className="flex space-y-4 pb-0 sm:pb-2">
        <p className="text-md text-lightPurple font-light italic">
          Splits can be adjusted by the
          <Badge variant="secondary" className="ml-1 border border-visible">
            <ForwardIcon className="w-4 h-4 mr-1 inline-block" />
            <span className="non-italic">Operator</span>
          </Badge>{" "}
          at any time.
        </p>
      </div>
      {suckers?.length > 1 && (
        <div className="mt-2 mb-4">
          <div className="text-sm text-lighPurple">See splits on</div>
          <Select
            onValueChange={(v) => setSelectedSucker(suckers[parseInt(v)])}
            value={
              selectedSucker
                ? String(suckers.indexOf(selectedSucker))
                : undefined
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select chain"></SelectValue>
            </SelectTrigger>
            <SelectContent>
              {suckers?.map((s, index) => (
                <SelectItem
                  key={s.peerChainId}
                  value={String(index)}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <ChainLogo chainId={s.peerChainId} />
                    <span>{chainNames[s.peerChainId]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex gap-1 pb-2 pt-2 text-md font-medium border-l border-lightPurple pl-3">
        <Badge variant="secondary" className="border border-visible">
          <ForwardIcon className="w-4 h-4 mr-1 inline-block" />
          <span className="non-italic">Operator</span>
        </Badge>{" "}
        is{" "}
        <EtherscanLink
          value={boostRecipient}
          type="address"
          chain={chainId ? ChainIdToChain[chainId] : undefined}
          truncateTo={6}
        />
      </div>
      <div className="max-h-96 overflow-auto bg-purplePanel rounded-tr-md rounded-br-md  border-limeGreenOpacity border mb-4">
        <div className="flex p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-auto">Account</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Pending Splits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                reservedTokenSplits?.map((split) => (
                  <TableRow key={split.beneficiary}>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row text-sm">
                        <EthereumAddress
                          address={split.beneficiary}
                          chain={
                            selectedSucker
                              ? ChainIdToChain[selectedSucker.peerChainId]
                              : chainId
                                ? ChainIdToChain[chainId]
                                : undefined
                          }
                          short
                          withEnsAvatar
                          withEnsName
                          className="hidden sm:block"
                        />
                        <EthereumAddress
                          address={split.beneficiary}
                          chain={
                            selectedSucker
                              ? ChainIdToChain[selectedSucker.peerChainId]
                              : chainId
                                ? ChainIdToChain[chainId]
                                : undefined
                          }
                          short
                          avatarProps={{ size: "sm" }}
                          withEnsAvatar
                          withEnsName
                          className="block sm:hidden"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatUnits(BigInt(split.percent), 7)} %
                    </TableCell>
                    <TableCell>
                      {pendingReserveTokenBalance
                        ? `
                          ${formatUnits(
                    (pendingReserveTokenBalance *
                              BigInt(split.percent)) /
                              BigInt(10 ** 9),
                    18
                  )}
                          ${formatTokenSymbol(token.data?.symbol)}
                        `
                        : "?"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
