export interface AuctionMetadata {
  id: number;
  title: string;
  author: string;
  image: string;
  thumbnails: string[];
  description: string;
  software: string;
  seller: string;
  startingBid: string;
  auctionStartTime: number;
  auctionEndTime: number;
  contractAddress: string;
  tokenId: string;
}

const STORAGE_KEY = "auctionMetadata";

// Get all metadata
export function getAllAuctionMetadata(): Record<number, AuctionMetadata> {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error reading auction metadata:", error);
    return {};
  }
}

// Get metadata for specific auction
export function getAuctionMetadata(auctionId: number): AuctionMetadata | null {
  const allMetadata = getAllAuctionMetadata();
  return allMetadata[auctionId] || null;
}

// Save metadata for an auction
export function saveAuctionMetadata(
  auctionId: number,
  metadata: Omit<AuctionMetadata, "id">
): void {
  if (typeof window === "undefined") return;

  try {
    const allMetadata = getAllAuctionMetadata();
    allMetadata[auctionId] = {
      id: auctionId,
      ...metadata,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMetadata));
    console.log("[Metadata] Saved metadata for auction", auctionId);
  } catch (error) {
    console.error("Error saving auction metadata:", error);
  }
}

// Save all metadata at once
export function saveAllAuctionMetadata(
  metadata: Record<number, AuctionMetadata>
): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
    console.log("[Metadata] Saved all auction metadata");
  } catch (error) {
    console.error("Error saving all auction metadata:", error);
  }
}

// Check if metadata exists
export function hasAuctionMetadata(auctionId: number): boolean {
  const metadata = getAuctionMetadata(auctionId);
  return metadata !== null;
}
