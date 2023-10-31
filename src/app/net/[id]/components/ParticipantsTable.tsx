import { EthereumAddress } from "@/components/EthereumAddress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ParticipantsQuery } from "@/generated/graphql";
import { formatPortion } from "@/lib/utils";
import { ForwardIcon } from "@heroicons/react/24/solid";
import { formatUnits } from "juice-hooks";
import { Address, isAddressEqual } from "viem";
import { useAccount } from "wagmi";
import { FetchTokenResult } from "wagmi/dist/actions";

export function ParticipantsTable({
  participants,
  token,
  totalSupply,
  boostRecipient,
}: {
  participants: ParticipantsQuery;
  token: FetchTokenResult;
  totalSupply: bigint;
  boostRecipient?: Address;
}) {
  const { address: accountAddress } = useAccount();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-auto md:w-1/2">Account</TableHead>
          <TableHead>Paid</TableHead>
          <TableHead>Tokens</TableHead>
          <TableHead>Ownership %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants?.participants.map((participant) => (
          <TableRow key={participant.id}>
            <TableCell>
              <div className="flex items-center">
                <EthereumAddress
                  address={participant.wallet.id}
                  short
                  withEnsAvatar
                  withEnsName
                />
                {boostRecipient &&
                isAddressEqual(
                  boostRecipient,
                  participant.wallet.id as Address
                ) ? (
                  <Badge variant="secondary" className="ml-2">
                    <ForwardIcon className="w-4 h-4 mr-1 inline-block" />
                    Boost
                  </Badge>
                ) : accountAddress &&
                  isAddressEqual(
                    accountAddress,
                    participant.wallet.id as Address
                  ) ? (
                  <Badge variant="secondary" className="ml-2">
                    You
                  </Badge>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              {formatUnits(participant.volume, 18, { decimals: 8 })} ETH
            </TableCell>
            <TableCell>
              {formatUnits(participant.balance, token.decimals, {
                decimals: 8,
              })}{" "}
              {token.symbol}
            </TableCell>
            <TableCell>
              {participant.balance
                ? formatPortion(BigInt(participant.balance), totalSupply)
                : 0}
              %
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
