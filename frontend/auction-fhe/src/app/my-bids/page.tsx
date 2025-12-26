"use client";

import { useAccount } from "wagmi";
import { useUserBids, useAuctionData } from "@/hooks/useAuction";
import { getAuctionMetadata } from "@/lib/auctionMetadata";
import { useRouter } from "next/navigation";
import { createStyles } from "antd-style";
import AuctionCard from "@/components/AutionCard.tsx";
import WalletButton from "@/components/ButtonWallet/WalletButton";
import { Alert } from "@lobehub/ui";

const useStyles = createStyles(({ css, token }) => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
    background: ${token.colorBgLayout};
  `,

  container: css`
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 40px 16px;
  `,

  header: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 40px;
  `,

  title: css`
    font-family: Onest, sans-serif;
    font-size: 36px;
    font-weight: 600;
    color: ${token.colorText};
    margin: 0;
  `,

  description: css`
    font-size: 16px;
    color: ${token.colorTextSecondary};
    margin: 0;
  `,

  connectSection: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    min-height: 400px;
    padding: 40px;
    background: ${token.colorBgContainer};
    border-radius: 16px;
    border: 1px solid ${token.colorBorder};
  `,

  connectTitle: css`
    font-size: 24px;
    font-weight: 600;
    color: ${token.colorText};
    margin: 0;
  `,

  connectDescription: css`
    font-size: 16px;
    color: ${token.colorTextSecondary};
    text-align: center;
    max-width: 400px;
    margin: 0;
  `,

  loadingSection: css`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    font-size: 18px;
    color: ${token.colorTextSecondary};
  `,

  emptySection: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    min-height: 400px;
    padding: 40px;
    background: ${token.colorBgContainer};
    border-radius: 16px;
    border: 1px solid ${token.colorBorder};
  `,

  emptyTitle: css`
    font-size: 24px;
    font-weight: 600;
    color: ${token.colorText};
    margin: 0;
  `,

  emptyDescription: css`
    font-size: 16px;
    color: ${token.colorTextSecondary};
    text-align: center;
    max-width: 400px;
    margin: 0;
  `,

  browseButton: css`
    margin-top: 16px;
    padding: 12px 24px;
    background: #ffffff;
    color: #000;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f0f0f0;
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  `,

  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 40px;
    width: 100%;
  `,

  statsCard: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    padding: 24px;
    background: ${token.colorBgContainer};
    border-radius: 16px;
    border: 1px solid ${token.colorBorder};
    margin-bottom: 32px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  `,

  statItem: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,

  statLabel: css`
    font-size: 14px;
    color: ${token.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,

  statValue: css`
    font-size: 28px;
    font-weight: 600;
    color: ${token.colorText};
  `,
}));

export default function MyBidsPage() {
  const { styles } = useStyles();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { userBids, isLoading, error } = useUserBids(address);

  // Not connected
  if (!isConnected) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>My Bids</h1>
            <p className={styles.description}>
              View all auctions where you have placed encrypted bids
            </p>
          </div>

          <div className={styles.connectSection}>
            <h2 className={styles.connectTitle}>Connect Your Wallet</h2>
            <p className={styles.connectDescription}>
              Please connect your wallet to view your bids and participate in
              auctions
            </p>
            <WalletButton />
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>My Bids</h1>
            <p className={styles.description}>
              View all auctions where you have placed encrypted bids
            </p>
          </div>

          <div className={styles.loadingSection}>
            <span>Loading your bids...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>My Bids</h1>
          </div>

          <Alert
            type="error"
            message="Error Loading Bids"
            description={
              error.message || "Failed to load your bids. Please try again."
            }
            showIcon
          />
        </div>
      </div>
    );
  }

  // No bids
  if (userBids.length === 0) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>My Bids</h1>
            <p className={styles.description}>
              View all auctions where you have placed encrypted bids
            </p>
          </div>

          <div className={styles.emptySection}>
            <h2 className={styles.emptyTitle}>No Bids Yet</h2>
            <p className={styles.emptyDescription}>
              You haven not placed any bids yet. Browse active auctions and place
              your first encrypted bid!
            </p>
            <button
              className={styles.browseButton}
              onClick={() => router.push("/")}
            >
              Browse Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Bids</h1>
          <p className={styles.description}>
            Track all auctions where you have placed encrypted bids
          </p>
        </div>

        {/* Stats Card */}
        <div className={styles.statsCard}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Bids</span>
            <span className={styles.statValue}>{userBids.length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Active Bids</span>
            <span className={styles.statValue}>{userBids.length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Your Address</span>
            <span className={styles.statValue} style={{ fontSize: "14px" }}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        </div>

        {/* Bids Grid */}
        <div className={styles.grid}>
          {userBids.map((auctionId) => (
            <MyBidCard key={auctionId} auctionId={auctionId} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Component to display each bid card
function MyBidCard({ auctionId }: { auctionId: number }) {
  const { auction, isLoading } = useAuctionData(auctionId);

  const metadata = getAuctionMetadata(auctionId);

  if (isLoading || !auction) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>
    );
  }

  const now = Date.now();
  const timeRemaining = Number(auction.endTime) * 1000 - now;
  const isActive = timeRemaining > 0;

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Ended";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <AuctionCard
      id={auctionId}
      title={metadata?.title || `Auction #${auctionId}`}
      type="NFT"
      currentBid="Encrypted"
      timeLeft={formatTimeRemaining(timeRemaining)}
      status={isActive ? "active" : "ending-soon"}
      bidders={Number(auction.bidCount)}
      imageUrl={metadata?.image}
    />
  );
}
