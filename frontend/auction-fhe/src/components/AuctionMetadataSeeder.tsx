"use client";

import { useEffect } from "react";
import {
  saveAllAuctionMetadata,
  getAllAuctionMetadata,
} from "@/lib/auctionMetadata";
import { mockAuctionsData } from "@/lib/mockAuctions";

export default function AuctionMetadataSeeder() {
  useEffect(() => {
    // Check if already seeded
    const existingData = getAllAuctionMetadata();
    const hasData = Object.keys(existingData).length > 0;

    if (!hasData) {
      console.log("[Seeder] Seeding mock auction metadata...");
      saveAllAuctionMetadata(mockAuctionsData);
      console.log(
        "[Seeder] Seeded",
        Object.keys(mockAuctionsData).length,
        "auctions"
      );
    } else {
      console.log("[Seeder] Metadata already exists, skipping seed");
    }
  }, []);

  return null; // This component doesn't render anything
}
