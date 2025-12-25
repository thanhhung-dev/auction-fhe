'use client'
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, usePublicClient, useReadContract } from "wagmi";
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
    console.log('[Auction] Checking FHE SDK status...');
    if (!isFHEReady()) {
      console.log('[Auction] Waiting for FHE SDK to load...');
      const ready = await waitForFHE(15000);
      if (!ready) {
        throw new Error("FHE SDK not loaded. Please refresh the page and try again.");
      }
    }

    try {
      // Convert ETH to Gwei for encryption (1 ETH = 1e9 Gwei)
      // This keeps the value within 64-bit integer range
      const bidGwei = parseGwei(bidAmount);

      console.log('[Auction] Encrypting bid:', {
        auctionId,
        bidAmount,
        bidGwei: bidGwei.toString(),
      });

      // Encrypt the bid using FHE
      const { handle, proof } = await encryptBid(
        bidGwei,
        address as `0x${string}`
      );

      console.log('[Auction] Bid encrypted, submitting to contract...');

      // Submit encrypted bid to contract
      const hash = await writeContractAsync({
        address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: AuctionABI.abi,
        functionName: "submitBid",
        args: [BigInt(auctionId), handle, proof],
        gas: 12_000_000n,
      });

      console.log('[Auction] Transaction submitted:', hash);

      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });

      console.log('[Auction] Bid placed successfully!');
      return { hash, receipt };
    } catch (error) {
      console.error("[Auction] Failed to place bid:", error);
      throw error;
    }
  };

  /**
   * Submit an encrypted bid directly (with pre-encrypted data)
   * @param auctionId The auction ID to bid on
   * @param encryptedBid The encrypted bid handle (bytes32)
   * @param bidProof The proof bytes
   */
  const submitBid = async (auctionId: number, encryptedBid: `0x${string}`, bidProof: `0x${string}`) => {
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
  const createAuction = async (startPrice: string, duration: number) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      const startPriceWei = parseEther(startPrice);

      const hash = await writeContractAsync({
        address: AUCTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: AuctionABI.abi,
        functionName: "createAuction",
        args: [startPriceWei, BigInt(duration)],
      });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      return { hash, receipt };
    } catch (error) {
      console.error("Failed to create auction:", error);
      throw error;
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
    args: userAddress ? [BigInt(auctionId), userAddress as `0x${string}`] : undefined,
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
        for (let i = 0; i < count; i++) {
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
