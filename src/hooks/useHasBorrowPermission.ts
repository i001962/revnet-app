import { JBChainId } from "juice-sdk-react";
import { HasPermissionDocument } from "@/generated/graphql";
import { useBendystrawQuery } from "@/graphql/useBendystrawQuery";
import { useReadRevDeployerLoansOf } from "@/hooks/useReadRevDeployerLoansOf";

export function useHasBorrowPermission({
  address,
  projectId,
  chainId,
  resolvedPermissionsAddress,
  skip,
}: {
  address?: `0x${string}`;
  projectId: bigint;
  chainId?: number;
  resolvedPermissionsAddress?: `0x${string}`;
  skip?: boolean;
}) {
  const { data: operator } = useReadRevDeployerLoansOf({
    revnetId: projectId,
    chainId: chainId as JBChainId | undefined,
    enabled: !skip && chainId !== undefined,
  });

  const querySkip =
    skip ||
    !address ||
    !projectId ||
    !chainId ||
    !resolvedPermissionsAddress ||
    !operator;

  const { data } = useBendystrawQuery(
    HasPermissionDocument,
    {
      account: address as string,
      chainId: chainId as number,
      projectId: Number(projectId),
      operator: operator as string,
    },
    { enabled: !querySkip }
  );

  return data?.permissionHolder?.permissions?.includes(1) ?? undefined;
}
