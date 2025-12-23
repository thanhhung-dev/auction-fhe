'use client';

import { createStyles } from 'antd-style';
import AuctionCard from './AutionCard.tsx';

const useStyles = createStyles(({ css, token }) => ({
  wrapper: css`
    display: flex;
    padding: 80px 360px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: ${token.colorBgLayout};
    border-top: 1px solid ${token.colorBorder};
    
    @media (max-width: 1250px) {
      padding: 60px 20px;
    }
  `,

  container: css`
    width: 100%;
    max-width: 1200px;
    display: flex;
    flex-direction: column;
    gap: 48px;
  `,

  grid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    width: 100%;
    
    @media (max-width: 1024px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  `,
}));

const auctions = [
  {
    id: 1,
    title: "Drik",
    type: "NFT" as const,
    currentBid: "0.01 ETH",
    timeLeft: "89d 23h",
    status: "active" as const,
    bidders: 0,
    imageUrl: "/access/ailen.png",
  },
  {
    id: 2,
    title: "Lion",
    type: "DeFi Debt" as const,
    currentBid: "0.01 ETH",
    timeLeft: "89d 23h",
    status: "active" as const,
    bidders: 0,
    imageUrl: "/access/stutu.png",
  },
  {
    id: 3,
    title: "Furry Felix",
    type: "NFT" as const,
    currentBid: "0.01 ETH",
    timeLeft: "89d 23h",
    status: "active" as const,
    bidders: 0,
    imageUrl: "/access/furry.png",
  },
  {
    id: 4,
    title: "Thralia",
    type: "Token" as const,
    currentBid: "0.01 ETH",
    timeLeft: "89d 23h",
    status: "active" as const,
    bidders: 0,
    imageUrl: "/access/ailenske.png",
  },
  {
    id: 5,
    title: "Alligator",
    type: "DeFi Debt" as const,
    currentBid: "0.01 ETH",
    timeLeft: "89d 23h",
    status: "active" as const,
    bidders: 0,
    imageUrl: "/access/tiger.png",
  },
  {
    id: 6,
    title: "Duck",
    type: "NFT" as const,
    currentBid: "0.01 ETH",
    timeLeft: "89d 23h",
    status: "active" as const,
    bidders: 0,
    imageUrl: "/access/kitcheck.png",
  },
];

export default function FeaturesSection() {
  const { styles } = useStyles();

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* CSS Grid thay vì Lobe UI Grid */}
        <div className={styles.grid}>
          {auctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              {...auction}
            />
          ))}
        </div>
      </div>
    </div>
  );
}