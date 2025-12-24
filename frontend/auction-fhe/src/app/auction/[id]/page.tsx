import AuctionDetail from '@/components/AuctionDetails';
import { notFound } from 'next/navigation';
import { use } from 'react';

// Mock auction data
const auctionsData = {
  "1": {
    id: "1",
    title: "Dirk",
    author: "Product Hub",
    seller: "0xabc...123",
    highestBidder: "0x000...",
    startingBid: "0.1",
    software: "Maya",
    description:
      "A legendary dragon NFT with unique characteristics. This rare piece features intricate details and stunning visual effects, making it a must-have for collectors.",
    mainImage:
      "https://framerusercontent.com/images/lTHltm78QxmlNMOKIlALAcl5w.png",
    thumbnails: [
      "https://framerusercontent.com/images/lTHltm78QxmlNMOKIlALAcl5w.png",
      "https://framerusercontent.com/images/DE7BVksLIxrjvsIPiAJv30lDCg.png",
      "https://framerusercontent.com/images/e9gghZY5xrwCsjSBVRLAsLvKQ.png",
      "https://framerusercontent.com/images/hz3VvBHeJ07N59YOrdVyIzaUfs.png",
    ],
    auctionStartTime: Date.now() - 1 * 24 * 60 * 60 * 1000, // ms
    auctionEndTime: Date.now() + 2 * 24 * 60 * 60 * 1000, // ms
    contractAddress: "0x1234...5678",
    tokenId: "42",
    state: 1,
  },
  "2": {
    id: "2",
    title: "Lion",
    author: "Product Hub",
    seller: "0xabc...123",
    highestBidder: "0x000...",
    startingBid: "0.05",
    software: "Blender",
    description:
      "An epic legendary sword with mystical powers. Perfect for gaming and metaverse applications.",
    mainImage:
      "https://framerusercontent.com/images/sRzo2BrL41hfoV7XziSYzCY2Ks.png",
    thumbnails: [
      "https://framerusercontent.com/images/sRzo2BrL41hfoV7XziSYzCY2Ks.png",
      "https://framerusercontent.com/images/LKL10KrQMprnihV1m6kF7PfOc.png",
      "https://framerusercontent.com/images/tlufYIuN8KpFd1jyKVuT4Ffak4.png",
      "https://framerusercontent.com/images/DCCJLpPpY5UV1EnAgY4ELhgVKA.png",
    ],
    auctionStartTime: Date.now() - 12 * 60 * 60 * 1000, // Started 12 hours ago
    auctionEndTime: Date.now() + 5 * 60 * 60 * 1000, // Ends in 5 hours
    contractAddress: "0xabcd...efgh",
    tokenId: "123",
    state: 1,
  },
  "3": {
    id: "3",
    title: "Furry Felix",
    author: "Product Hub",
    seller: "0xabc...123",
    highestBidder: "0x000...",
    startingBid: "0.2",
    software: "Cinema 4D",
    description:
      "A collection of rare mystic gems with unique properties and stunning visuals.",
    mainImage:
      "https://framerusercontent.com/images/9pTpxLi7pjrHTpZEaCBqtJIRGNk.png",
    thumbnails: [
      "https://framerusercontent.com/images/9pTpxLi7pjrHTpZEaCBqtJIRGNk.png",
      "https://framerusercontent.com/images/1MJLbAsGcTshSSjftjzIHRreEb8.png",
      "https://framerusercontent.com/images/eJExkoJ6WKLhWxDFyvdz8cdlw.png",
      "https://framerusercontent.com/images/eJExkoJ6WKLhWxDFyvdz8cdlw.png",
    ],
    auctionStartTime: Date.now() - 6 * 60 * 60 * 1000, // Started 6 hours ago
    auctionEndTime: Date.now() + 12 * 60 * 60 * 1000, // Ends in 12 hours
    contractAddress: "0x9876...5432",
    tokenId: "999",
    state: 1,
  },
  "4": {
    id: "4",
    title: "Thralia",
    author: "Product Hub",
    seller: "0xabc...123",
    highestBidder: "0x000...",
    startingBid: "0.15",
    software: "ZBrush",
    description:
      "An ancient mystical relic with powerful enchantments. A true collector's item.",
    mainImage:
      "https://framerusercontent.com/images/tMuk0nLay7UliU1ikV18AIApjiI.png",
    thumbnails: [
      "https://framerusercontent.com/images/tMuk0nLay7UliU1ikV18AIApjiI.png",
      "https://framerusercontent.com/images/tMuk0nLay7UliU1ikV18AIApjiI.png",
      "https://framerusercontent.com/images/Qg7fjIDZS9X4GtxnUAt3eJRycs.png",
      "https://framerusercontent.com/images/zqSQdFdC8yLDzVM5r05p3DTCUc.png",
    ],
    auctionStartTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
    auctionEndTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
    contractAddress: "0xrelic...1234",
    tokenId: "777",
    state: 1,
  },
  "5": {
    id: "5",
    title: "Alligator",
    author: "Product Hub",
    seller: "0xabc...123",
    highestBidder: "0x000...",
    startingBid: "0.08",
    software: "Maya",
    description:
      "A powerful cosmic warrior from the outer realms. Battle-tested and legendary.",
    mainImage:
      "https://framerusercontent.com/images/JQLxkAHxmY7CXzHpcG56gjk7A.png",
    thumbnails: [
      "https://framerusercontent.com/images/JQLxkAHxmY7CXzHpcG56gjk7A.png",
      "https://framerusercontent.com/images/FXLX1hfOCdULT27XJyyguiDhWyo.png",
      "https://framerusercontent.com/images/97SIclWREoz24Q6ai8xRKONMck.png",
      "https://framerusercontent.com/images/1BveyNgUyRtzo5AXKTQczBzCqVI.png",
    ],
    auctionStartTime: Date.now() - 18 * 60 * 60 * 1000,
    auctionEndTime: Date.now() + 1 * 24 * 60 * 60 * 1000,
    contractAddress: "0xcosmic...5678",
    tokenId: "888",
    state: 1,
  },
  "6": {
    id: "6",
    title: "Shadow Beast",
    author: "Product Hub",
    seller: "0xabc...123",
    highestBidder: "0x000...",
    startingBid: "0.12",
    software: "Blender",
    description:
      "A fearsome shadow beast from the dark dimension. Rare and powerful.",
    mainImage:
      "https://framerusercontent.com/images/wlcclkL11Fiv9kpHIM3zW38lArI.png",
    thumbnails: [
      "https://framerusercontent.com/images/wlcclkL11Fiv9kpHIM3zW38lArI.png",
      "https://framerusercontent.com/images/pme3TjuRLUIrFFqpdJ1G0H4WWKY.png",
      "https://framerusercontent.com/images/QuytPq9yOJ2QyZnecQ9uElNA8eY.png",
      "https://framerusercontent.com/images/ueQMlgmM0rISKsw8kJKP33gmAI.png",
    ],
    auctionStartTime: Date.now() - 8 * 60 * 60 * 1000,
    auctionEndTime: Date.now() + 18 * 60 * 60 * 1000,
    contractAddress: "0xshadow...9012",
    tokenId: "666",
    state: 1,
  },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default function AuctionPage(props: Props) {
  const params = use(props.params);
  const { id } = params;
  const auction = auctionsData[id as keyof typeof auctionsData];

  if (!auction) {
    notFound();
  }

  // Get related auctions (exclude current auction)
  const relatedAuctions = Object.values(auctionsData)
    .filter((a) => a.id !== id)
    .slice(0, 3)
    .map((a) => ({
      id: a.id,
      title: a.title,
      image: a.mainImage,
      isAuction: true,
      auctionEndsAt: a.auctionEndTime,
    }));

  return <AuctionDetail auction={auction} relatedAuctions={relatedAuctions} />;
}

export async function generateStaticParams() {
  return Object.keys(auctionsData).map((id) => ({
    id: id,
  }));
}