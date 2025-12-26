import AuctionDetail from "@/components/AuctionDetails";
import { notFound } from "next/navigation";
import { use } from "react";
import { mockAuctionsData } from "@/lib/mockAuctions"; // 1. Import dữ liệu gốc

type Props = {
  params: Promise<{ id: string }>;
};

export default function AuctionPage(props: Props) {
  const params = use(props.params);
  const { id } = params;

  // 2. Chuyển id từ string sang number để tìm trong object
  const auctionId = parseInt(id);
  const sourceAuction = mockAuctionsData[auctionId];

  if (!sourceAuction) {
    notFound();
  }

  const auction = {
    ...sourceAuction,
    id: sourceAuction.id,
    mainImage: sourceAuction.image, // Map 'image' -> 'mainImage'
    highestBidder: "0x000...",
    state: 1,
  };

  const relatedAuctions = Object.values(mockAuctionsData)
    .filter((a) => a.id !== auctionId)
    .slice(0, 3)
    .map((a) => ({
      id: a.id.toString(),
      title: a.title,
      image: a.image,
      isAuction: true,
      auctionEndsAt: a.auctionEndTime,
    }));

  return <AuctionDetail auction={auction} relatedAuctions={relatedAuctions} />;
}

// 5. Tạo static paths từ mock data gốc
export async function generateStaticParams() {
  return Object.keys(mockAuctionsData).map((id) => ({
    id: id,
  }));
}
