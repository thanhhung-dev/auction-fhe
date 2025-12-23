import { toast as sonnerToast } from "sonner";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  txHash?: string;
}

export function useToast() {
  const toast = ({ title, description, variant, txHash }: ToastOptions) => {
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description: txHash ? (
          <div className="flex flex-col gap-1">
            <span>{description}</span>
            <a
              href={`${SEPOLIA_EXPLORER}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-sm"
            >
              View on Etherscan
            </a>
          </div>
        ) : description,
      });
    } else {
      sonnerToast.success(title, {
        description: txHash ? (
          <div className="flex flex-col gap-1">
            <span>{description}</span>
            <a
              href={`${SEPOLIA_EXPLORER}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-sm"
            >
              View on Etherscan
            </a>
          </div>
        ) : description,
      });
    }
  };

  return { toast };
}

// Transaction notification utilities
export const txToast = {
  pending: (message: string = "Transaction pending...") => {
    return sonnerToast.loading(message, {
      description: "Please confirm in your wallet",
    });
  },

  success: (txHash: string, message: string = "Transaction confirmed!") => {
    sonnerToast.success(message, {
      description: (
        <a
          href={`${SEPOLIA_EXPLORER}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          View on Etherscan
        </a>
      ),
    });
  },

  error: (error: any, txHash?: string) => {
    const message = error?.shortMessage || error?.message || "Transaction failed";
    sonnerToast.error("Transaction Failed", {
      description: txHash ? (
        <div className="flex flex-col gap-1">
          <span>{message}</span>
          <a
            href={`${SEPOLIA_EXPLORER}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline text-sm"
          >
            View on Etherscan
          </a>
        </div>
      ) : message,
    });
  },

  dismiss: (toastId: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};
