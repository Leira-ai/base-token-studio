import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
} from "viem";

export type FriendlyError = {
  message: string;
  /** Rejections are a normal outcome, not a failure worth styling as one. */
  isRejection: boolean;
};

/**
 * Wallet and RPC errors arrive as deeply nested cause chains whose top-level
 * message is usually a stack trace. `walk` finds the meaningful cause so the UI
 * can show one sentence instead.
 */
export function toFriendlyError(error: unknown): FriendlyError | null {
  if (!error) return null;

  if (error instanceof BaseError) {
    if (error.walk((e) => e instanceof UserRejectedRequestError)) {
      return {
        message: "You rejected the request in your wallet.",
        isRejection: true,
      };
    }

    if (error.walk((e) => e instanceof InsufficientFundsError)) {
      return {
        message: "Not enough ETH to cover the amount plus gas.",
        isRejection: false,
      };
    }

    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      const reason = reverted.data?.errorName ?? reverted.reason;
      return {
        message: reason
          ? `The contract rejected this call: ${reason}.`
          : "The contract rejected this call.",
        isRejection: false,
      };
    }

    return { message: error.shortMessage, isRejection: false };
  }

  if (error instanceof Error) {
    return { message: error.message, isRejection: false };
  }
  return { message: "Something went wrong.", isRejection: false };
}
