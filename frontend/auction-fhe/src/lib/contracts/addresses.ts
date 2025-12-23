/**
 * Smart contract addresses configuration
 * Update these after deploying contracts to Sepolia
 */

export const AUCTION_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string) ||
  "0xbF2A26Bad75721e80332455191D435e194382276"; // SimpleFHEAuction on Sepolia

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string) ||
  "0x0000000000000000000000000000000000000000"; // For testing with NFTs

// Chain configuration
export const SEPOLIA_CHAIN_ID = 11155111;

// Block explorer
export const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";
