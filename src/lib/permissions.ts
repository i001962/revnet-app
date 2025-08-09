import { jbPermissionsAbi } from "juice-sdk-core";
import { Address } from "viem";

export async function grantSwapPoolPermission(
  opts: {
    walletClient: any;
    account: `0x${string}`;
    permissionsContract: `0x${string}`;
    operator: `0x${string}`;
    projectId?: bigint; // 0n for global; pass specific projectId for scoped
  }
) {
  const { walletClient, account, permissionsContract, operator, projectId = 0n } = opts;

  return walletClient.writeContract({
    account,
    address: permissionsContract,
    abi: jbPermissionsAbi,
    functionName: "setPermissionsFor",
    args: [
      account,
      {
        operator,
        projectId,
        permissionIds: [26], // ADD_SWAP_TERMINAL_POOL
      },
    ],
  });
}



