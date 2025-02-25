import { ChainLogo } from "@/components/ChainLogo";
import { EthereumAddress } from "@/components/EthereumAddress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Participant } from "@/generated/graphql";
import { formatPortion, formatTokenSymbol } from "@/lib/utils";
import { formatUnits } from "juice-sdk-core";
import { JBChainId } from "juice-sdk-react";
import { Address, isAddressEqual } from "viem";
import { UseTokenReturnType, useAccount } from "wagmi";

export function ParticipantsTable({
  participants,
  token,
  totalSupply,
  boostRecipient,
}: {
  participants: (Participant & { chains: JBChainId[] })[];
  token: UseTokenReturnType["data"] | null;
  totalSupply: bigint;
  boostRecipient?: Address;
}) {
  console.log(participants)
  if (participants.length === 0) return (
    <div className="text-center text-zinc-400">
      No owners yet. Pay in to become an owner. 
    </div>
  );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-auto md:w-1/2">Account</TableHead>
          <TableHead>Balance</TableHead>
          <TableHead>Chains</TableHead>
          <TableHead>Paid</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((participant) => (
          <TableRow key={participant.wallet.id}>
            <TableCell>
              <div className="flex flex-col sm:flex-row gap-2 items-center pr-10">
                <div className="hidden sm:flex">
                  <EthereumAddress
                    address={participant.wallet.id as Address}
                    short
                    withEnsAvatar
                    withEnsName
                  />
                </div>
                <div className="flex sm:hidden">
                  <EthereumAddress
                    address={participant.wallet.id as Address}
                    short
                    withEnsAvatar
                    avatarProps={{ size: "sm" }}
                    withEnsName
                  />
                </div>
              </div>
            </TableCell>
            {token ? (
              <TableCell className="whitespace-nowrap">
                {formatUnits(participant.balance, token.decimals, {
                  fractionDigits: 8,
                })}{" "}
                {formatTokenSymbol(token.symbol)} {" | "}
                <span className="font-bold">
                  {participant.balance
                    ? formatPortion(BigInt(participant.balance), totalSupply)
                    : 0}
              %
                </span>
              </TableCell>
            ) : null}
            <TableCell className="whitespace-nowrap">
              <div className="flex items-center gap-1">
                {participant.chains.map((chain) => (
                  <ChainLogo
                    chainId={chain}
                    key={chain}
                    width={14}
                    height={14}
                  />
                ))}
              </div>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {formatUnits(participant.volume, 18, { fractionDigits: 64 })} ETH
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
