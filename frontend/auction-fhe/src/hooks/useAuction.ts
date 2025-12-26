"use client";
import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  usePublicClient,
  useReadContract,
} from "wagmi";
import { parseEther, parseGwei } from "viem";
import { AUCTION_CONTRACT_ADDRESS } from "@/lib/contracts/addresses";
import { encryptBid, waitForFHE, isFHEReady } from "@/lib/fhe";
import AuctionABI from "@/lib/contracts/SimpleFHEAuction.json";
import { Alert } from "@lobehub/ui";
export interface AuctionData {
  seller: string;
  startPrice: bigint;
  startTime: bigint;
  endTime: bigint;
  highestBidder: string;
  revealedHighestBid: bigint;
  ended: boolean;
  settled: boolean;
  cancelled: boolean;
  bidCount: bigint;
}

// Compute auction state from flags
export function getAuctionState(auction: AuctionData): number {
  if (auction.cancelled) return 4; // Cancelled
  if (auction.settled) return 3; // Settled
  if (auction.ended) return 2; // Ended
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (now >= auction.startTime && now < auction.endTime) return 1; // Active
  return 0; // Pending
}

/**
 * Hook for interacting with SimpleFHE Auction contract
 */
export function useAuction() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  /**
   * Place an encrypted bid on an auction
   * @param auctionId The auction ID to bid on
   * @param bidAmount The bid amount in ETH (as string, e.g., "0.1")
   */
  const placeBid = async (auctionId: number, bidAmount: string) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    // Wait for FHE SDK to load
    console.log("[Auction] Checking FHE SDK status...");
    if (!isFHEReady()) {
      console.log("[Auction] Waiting for FHE SDK to load...");
      const ready = await waitForFHE(15000);
      if (!ready) {
        throw new Error(
          "FHE SDK not loaded. Please refresh the page and try again."
        );
      }
    }

    try {
      // Convert ETH to Gwei for encryption (1 ETH = 1e9 Gwei)
      const bidGwei = parseGwei(bidAmount);

      console.log("[Auction] Encrypting bid:", {
        auctionId,
        bidAmount,
        bidGwei: bidGwei.toString(),
      });

      // Encrypt the bid using FHE
      const { handle, proof } = await encryptBid(
        bidGwei,
        address as `0x${string}`
      );

      console.log("[Auction] Bid encrypted, submitting to contract...", {
        handle,
        proofLength: proof.length,
      });

      // ⭐ ESTIMATE GAS TRƯỚC KHI SUBMIT
      let estimatedGas;
      try {
        estimatedGas = await publicClient?.estimateContractGas({
          address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
          abi: AuctionABI.abi,
          functionName: "submitBid",
          args: [BigInt(auctionId), handle, proof],
          account: address,
        });
        console.log("[Auction] Estimated gas:", estimatedGas);
      } catch (estimateError: any) {
        console.error("[Auction] Gas estimation failed:", estimateError);

        // ⭐ PARSE REVERT REASON TỪ ESTIMATE ERROR
        let revertReason = "Unknown error";

        if (estimateError.message) {
          console.log("[Auction] Error message:", estimateError.message);

          // Check for common revert reasons
          if (estimateError.message.includes("Auction not active")) {
            revertReason = "Auction is not active yet or has ended";
          } else if (estimateError.message.includes("Bid too low")) {
            revertReason = "Your bid is below the minimum required amount";
          } else if (estimateError.message.includes("Already bid")) {
            revertReason = "You have already placed a bid on this auction";
          } else if (estimateError.message.includes("insufficient funds")) {
            revertReason = "Insufficient funds in your wallet";
          } else {
            revertReason = estimateError.message;
          }
        }

        if (estimateError.details) {
          console.log("[Auction] Error details:", estimateError.details);
        }

        if (estimateError.data) {
          console.log("[Auction] Error data:", estimateError.data);
        }

        throw new Error(`Transaction will fail: ${revertReason}`);
      }

      // Add 20% buffer to estimated gas
      const gasWithBuffer = estimatedGas
        ? (estimatedGas * 120n) / 100n
        : undefined;

      console.log("[Auction] Submitting transaction with gas:", gasWithBuffer);

      // Submit encrypted bid to contract
      const hash = await writeContractAsync({
        address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: AuctionABI.abi,
        functionName: "submitBid",
        args: [BigInt(auctionId), handle, proof],
        gas: gasWithBuffer,
      });

      console.log("[Auction] Transaction submitted:", hash);

      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({
        hash,
      });

      console.log("[Auction] Transaction receipt:", receipt);

      if (receipt?.status === "reverted") {
        throw new Error(
          "Transaction reverted. Please check the contract requirements."
        );
      }

      console.log("[Auction] Bid placed successfully!");
      return { hash, receipt };
    } catch (error: any) {
      console.error("[Auction] Failed to place bid:", error);

      // ⭐ DETAILED ERROR PARSING
      let errorMessage = "Failed to place bid";

      if (error.message) {
        errorMessage = error.message;
      }

      // Parse common error patterns
      if (error.message?.includes("insufficient funds")) {
        const match = error.message.match(/balance (\d+)/);
        if (match) {
          const balanceWei = BigInt(match[1]);
          const balanceEth = Number(balanceWei) / 1e18;
          errorMessage = `Insufficient funds. Your balance: ${balanceEth.toFixed(
            6
          )} ETH. Please get more Sepolia ETH from a faucet.`;
        } else {
          errorMessage =
            "Insufficient funds. Please get more Sepolia ETH from a faucet.";
        }
      } else if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction rejected by user";
      } else if (error.shortMessage) {
        errorMessage = error.shortMessage;
      }

      // Log full error for debugging
      console.error("[Auction] Full error object:", {
        message: error.message,
        shortMessage: error.shortMessage,
        details: error.details,
        cause: error.cause,
        data: error.data,
      });

      throw new Error(errorMessage);
    }
  };

  /**
   * Submit an encrypted bid directly (with pre-encrypted data)
   * @param auctionId The auction ID to bid on
   * @param encryptedBid The encrypted bid handle (bytes32)
   * @param bidProof The proof bytes
   */
  const submitBid = async (
    auctionId: number,
    encryptedBid: `0x${string}`,
    bidProof: `0x${string}`
  ) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      const hash = await writeContractAsync({
        address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: AuctionABI.abi,
        functionName: "submitBid",
        args: [BigInt(auctionId), encryptedBid, bidProof],
      });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      return { hash, receipt };
    } catch (error) {
      console.error("Failed to submit bid:", error);
      throw error;
    }
  };

  /**
   * Create a new auction
   * @param startPrice Starting price in wei
   * @param duration Duration in seconds
   */
  /**
   * Create a new auction
   * @param startPrice Starting price in ETH (string)
   * @param duration Duration in seconds
   */
  const createAuction = async (startPrice: string, duration: number) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      // 1. Chuẩn bị dữ liệu đầu vào
      const startPriceWei = parseEther(startPrice);
      const durationBigInt = BigInt(duration);

      console.log("[Auction] Preparing to create auction:", {
        startPrice,
        startPriceWei,
        duration,
      });

      // 2. ⭐ ESTIMATE GAS (Sửa lỗi: Phải gọi hàm này trước khi tính buffer)
      let estimatedGas;
      try {
        estimatedGas = await publicClient?.estimateContractGas({
          address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
          abi: AuctionABI.abi,
          functionName: "createAuction",
          args: [startPriceWei, durationBigInt],
          account: address,
        });
        console.log("[Auction] Create Auction Estimated gas:", estimatedGas);
      } catch (estimateError: any) {
        console.error("[Auction] Gas estimation failed:", estimateError);

        // Parse lỗi revert thường gặp khi tạo Auction
        let revertReason = "Unknown error";
        if (estimateError.message) {
          if (estimateError.message.includes("Invalid duration")) {
            revertReason = "Duration must be greater than minimum time";
          } else if (estimateError.message.includes("Price must be > 0")) {
            revertReason = "Starting price must be greater than 0";
          } else if (estimateError.message.includes("Only owner")) {
            // Nếu contract có modifier
            revertReason = "Only the contract owner can create auctions";
          } else {
            revertReason = estimateError.shortMessage || estimateError.message;
          }
        }
        throw new Error(`Transaction will fail: ${revertReason}`);
      }

      // 3. Thêm 20% Buffer cho Gas
      const gasWithBuffer = estimatedGas
        ? (estimatedGas * 120n) / 100n
        : undefined;

      console.log(
        "[Auction] Submitting create transaction with gas:",
        gasWithBuffer
      );

      // 4. Gửi Transaction
      const hash = await writeContractAsync({
        address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: AuctionABI.abi,
        functionName: "createAuction",
        args: [startPriceWei, durationBigInt],
        gas: gasWithBuffer,
      });

      console.log("[Auction] Create transaction submitted:", hash);

      // 5. Chờ xác nhận
      const receipt = await publicClient?.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
      });

      if (receipt?.status === "reverted") {
        throw new Error("Transaction reverted on chain.");
      }

      console.log("[Auction] Auction created successfully!", receipt);
      return { hash, receipt };
    } catch (error: any) {
      console.error("Failed to create auction:", error);

      // Tái sử dụng logic parse lỗi (hoặc viết hàm helper riêng để đỡ lặp code)
      let errorMessage = error.message || "Failed to create auction";
      if (errorMessage.includes("insufficient funds")) {
        errorMessage = "Insufficient funds to pay for gas.";
      } else if (errorMessage.includes("user rejected")) {
        errorMessage = "Transaction rejected by user.";
      }

      throw new Error(errorMessage);
    }
  };

  /**
   * End an auction (only callable after endTime)
   */
  const endAuction = async (auctionId: number) => {
    try {
      const hash = await writeContractAsync({
        address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: AuctionABI.abi,
        functionName: "endAuction",
        args: [BigInt(auctionId)],
      });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      return { hash, receipt };
    } catch (error) {
      console.error("Failed to end auction:", error);
      throw error;
    }
  };

  /**
   * Cancel an auction (only callable by seller before any bids)
   */
  const cancelAuction = async (auctionId: number) => {
    try {
      const hash = await writeContractAsync({
        address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: AuctionABI.abi,
        functionName: "cancelAuction",
        args: [BigInt(auctionId)],
      });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      return { hash, receipt };
    } catch (error) {
      console.error("Failed to cancel auction:", error);
      throw error;
    }
  };

  return {
    placeBid,
    submitBid,
    createAuction,
    endAuction,
    cancelAuction,
  };
}

/**
 * Hook to read auction data from contract
 */
export function useAuctionData(auctionId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
    abi: AuctionABI.abi,
    functionName: "getAuction",
    args: [BigInt(auctionId)],
  });

  // Transform the tuple array to object
  const auction: AuctionData | undefined = data
    ? {
        seller: (data as any)[0],
        startPrice: (data as any)[1],
        startTime: (data as any)[2],
        endTime: (data as any)[3],
        highestBidder: (data as any)[4],
        revealedHighestBid: (data as any)[5],
        ended: (data as any)[6],
        settled: (data as any)[7],
        cancelled: (data as any)[8],
        bidCount: (data as any)[9],
      }
    : undefined;

  return {
    auction,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get total auction count
 */
export function useAuctionCount() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
    abi: AuctionABI.abi,
    functionName: "auctionCounter",
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to check if user has already bid on an auction
 */
export function useHasUserBid(auctionId: number, userAddress?: string) {
  const { data, isLoading, error } = useReadContract({
    address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
    abi: AuctionABI.abi,
    functionName: "hasUserBid",
    args: userAddress
      ? [BigInt(auctionId), userAddress as `0x${string}`]
      : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    hasBid: data as boolean | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to get all auctions where the user has placed a bid
 */
export function useUserBids(userAddress?: string) {
  const { count, isLoading: countLoading } = useAuctionCount();
  const publicClient = usePublicClient();
  const [userBids, setUserBids] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userAddress || !publicClient || count === 0) {
      setUserBids([]);
      return;
    }

    const fetchUserBids = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const bidAuctions: number[] = [];

        // Check each auction to see if user has bid
        for (let i = 1; i < count; i++) {
          const hasBid = await publicClient.readContract({
            address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
            abi: AuctionABI.abi,
            functionName: "hasUserBid",
            args: [BigInt(i), userAddress as `0x${string}`],
          });

          if (hasBid) {
            bidAuctions.push(i);
          }
        }

        setUserBids(bidAuctions);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserBids();
  }, [userAddress, publicClient, count]);

  return {
    userBids,
    isLoading: isLoading || countLoading,
    error,
  };
}
