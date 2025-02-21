import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  useJBContractContext,
  useWriteJbControllerSendReservedTokensToSplitsOf,
} from "juice-sdk-react";
import { useChainId, useWaitForTransactionReceipt } from "wagmi";

export function DistributeReservedTokensButton() {
  const { toast } = useToast();
  const {
    projectId,
    contracts: { controller },
  } = useJBContractContext();
  const chainId = useChainId();

  const { writeContract, isPending, data } =
    useWriteJbControllerSendReservedTokensToSplitsOf({
      mutation: {
        onSuccess() {
          toast({
            title: "Transaction submitted.",
          });
        },
      },
    });

  const {
    data: txData,
    isSuccess,
    isLoading: isTxLoading,
  } = useWaitForTransactionReceipt({
    hash: data,
  });

  return (
    <Button
      variant="outline"
      loading={isPending || isTxLoading}
      onClick={() => {
        if (!controller.data) {
          return;
        }

        if (!projectId) {
          return;
        }

        writeContract?.({
          chainId,
          address: controller.data,
          args: [projectId],
        });
      }}
    >
      Distribute pending splits
    </Button>
  );
}
