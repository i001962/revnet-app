export enum BorrowState {
  Idle = "idle",
  Checking = "checking",
  GrantingPermission = "granting-permission",
  PermissionGranted = "permission-granted",
  Approving = "approving",
  WaitingSignature = "waiting-signature",
  Pending = "pending",
  ReallocationPending = "reallocation-pending",
  Success = "success",
  ErrorPermissionDenied = "error-permission-denied",
  ErrorLoanCanceled = "error-loan-canceled",
  Error = "error",
}

export const borrowStatusMessages: Record<BorrowState, string> = {
  [BorrowState.Idle]: "",
  [BorrowState.Checking]: "Checking permissions...",
  [BorrowState.GrantingPermission]: "Granting permission...",
  [BorrowState.PermissionGranted]: "Permission granted. Processing loan...",
  [BorrowState.Approving]: "Approving token allowance...",
  [BorrowState.WaitingSignature]: "Waiting for wallet confirmation...",
  [BorrowState.Pending]: "Processing loan...",
  [BorrowState.ReallocationPending]: "Processing loan...",
  [BorrowState.Success]: "Loan processed successfully!",
  [BorrowState.ErrorPermissionDenied]: "Permission was not granted. Please approve to proceed.",
  [BorrowState.ErrorLoanCanceled]: "Loan transaction was canceled.",
  [BorrowState.Error]: "Something went wrong during loan processing.",
};

