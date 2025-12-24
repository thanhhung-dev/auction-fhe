'use client';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import AuctionCard from './AutionCard.tsx';
import { AuroraBackground } from '@lobehub/ui/awesome';
import { InputNumber } from '@lobehub/ui';
import { useAccount } from 'wagmi';
import { createStyles } from 'antd-style';
import { useParams } from 'next/navigation.js';
import { useAuction, useAuctionData } from '@/hooks/useAuction';

const useStyles = createStyles(({ css, token }) => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
    background: ${token.colorBgLayout};
  `,

  contentWrapper: css`
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    flex-flow: column;
    gap: 24px;
    height: min-content;
    overflow: hidden;
    padding: 24px 16px 56px;
    position: relative;
    width: 100%;
    background: ${token.colorBgLayout};
  `,

  breadcrumb: css`
    display: flex;
    align-items: center;
    gap: 24px;
    max-width: 1400px;
    width: 100%;
    height: 48px
    font-size: 14px;
    color: ${token.colorText};

    a {
      color: ${token.colorText};
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: ${token.colorText};
      }
    }

    span {
      color: ${token.colorText};
    }
  `,

  backButton: css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorder};
    border-radius: 8px;
    color: ${token.colorText};
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;

    &:hover {
      background: ${token.colorBgContainer};
      border-color: ${token.colorBorder};
    }
  `,

  container: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
      gap: 40px;
    }
  `,

  leftColumn: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
  `,

  mainImage: css`
    width: 100%;
    aspect-ratio: 1;
    background: ${token.colorBgContainer};
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid ${token.colorBorder};

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,

  thumbnails: css`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  `,

  thumbnail: css`
    aspect-ratio: 1;
    background: ${token.colorBgContainer};
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: ${token.colorBorder};
    }

    &.active {
      border-color: ${token.colorBorder};
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,

  rightColumn: css`
    display: flex;
    flex-direction: column;
    gap: 32px;
  `,

  header: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,

  titleRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  `,

  title: css`
    font-family: Onest, sans-serif;
    color: ${token.colorText};
    margin: 0;
    line-height: 1.2;
  `,

  statusBadge: css`
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    background: #2b2b2b;
    border-radius: 8px;
    color: ${token.colorText};
    font-size: 14px;
    font-weight: 500;
    flex-shrink: 0;
  `,

  info: css`
    font-family: Onest, sans-serif;
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
    color: ${token.colorText};
    margin: 0;
  `,

  infoLabel: css`
    color: ${token.colorText};
  `,

  auctionStats: css`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 20px;
    background: ${token.colorBgContainer};
    border-radius: 12px;
    border: 1px solid ${token.colorBorder};
  `,

  statItem: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,

  statLabel: css`
    font-size: 12px;
    color: ${token.colorText};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,

  statValue: css`
    font-size: 18px;
    font-weight: 600;
    color: ${token.colorText};
  `,

  bidSection: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,

  bidLabel: css`
    font-size: 14px;
    font-weight: 500;
    color: ${token.colorText};
    margin: 0;
  `,

  inputWrapper: css`
    .ant-input-number {
      width: 100%;
      height: 48px;
      background: ${token.colorBgContainer} !important;
      border: 1px solid ${token.colorBorder} !important;
      border-radius: 10px;

      &:hover {
        border-color: ${token.colorBorder} !important;
        background: ${token.colorBgContainer} !important;
      }

      &:focus,
      &.ant-input-number-focused {
        border-color: ${token.colorBorder} !important;
        background: ${token.colorBgContainer} !important;
        box-shadow: 0 0 0 2px ${token.colorBorder} !important;
      }

      .ant-input-number-input {
        color: ${token.colorText};
        font-size: 16px;
        font-weight: 500;
        height: 46px;
      }

      .ant-input-number-input::placeholder {
        color: ${token.colorText};
      }
    }
  `,

  bidButton: css`
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: #ffffffff;
    border: none;
    border-radius: 10px;
    color: #000;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: #ffffffff;
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
    }

    &:disabled {
      background: ${token.colorBgContainer};
      color: ${token.colorText};
      cursor: not-allowed;
    }
  `,

  descriptionSection: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `,

  sectionTitle: css`
    font-family: Onest, sans-serif;
    font-size: 28px;
    font-weight: 500;
    line-height: 39.2px;
    color: ${token.colorText};
    margin: 0;
  `,

  description: css`
    font-size: 15px;
    line-height: 1.7;
    color: ${token.colorText};
    margin: 0;
  `,

  relatedSection: css`
    flex-flow: column;
    flex: none;
    place-content: center;
    align-items: center;
    gap: 32px;
    width: 100%;
    height: min-content;
    padding: 24px 16px;
    display: flex;
    position: relative;
    overflow: hidden;
  `,

  relatedPtl: css`
    flex-flow: column;
    flex: none;
    place-content: flex-start center;
    align-items: flex-start;
    gap: 24px;
    width: 100%;
    max-width: 1400px;
    height: min-content;
    padding: 0;
    display: flex;
    position: relative;
    overflow: hidden;
  `,

  relatedTitle: css`
    white-space: pre-wrap;
    word-break: break-word;
    word-wrap: break-word;
    flex: none;
    width: 100%;
    height: auto;
    position: relative;
  `,

  relatedGrid: css`
  display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    grid-auto-rows: min-content;
    justify-content: center;
    gap: 40px;
    // width: 100%;
    max-width: 1400px;
    // height: min-content;
    padding: 0;
    position: relative;
  `,
}));
const AUCTION_STATES = ["Pending", "Active", "Ended", "Settled", "Cancelled"];
interface AuctionDetailProps {
  auction: {
    id: string;
    title: string;
    author: string;
    seller: string;
    highestBidder: string;
    startingBid: string;
    software: string;
    description: string;
    mainImage: string;
    thumbnails: string[];
    auctionStartTime: number; 
    auctionEndTime: number;
    contractAddress: string;
    tokenId: string;
    state: number;
  };
  relatedAuctions: Array<{
    id: string;
    title: string;
    image: string;
    isAuction: boolean;
    auctionEndsAt: number;
  }>;
}

export default function AuctionDetail({ auction, relatedAuctions }: AuctionDetailProps) {
  const { id } = useParams();
  const auctionId = Number(id);
  const { address } = useAccount();
  const { auction: chainAuction, isLoading } = useAuctionData(auctionId);
  const { placeBid, endAuction } = useAuction();

  const [bidAmount, setBidAmount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const { styles, cx } = useStyles();


  //   const isActive = auction.state === 1;
  const hasEnded = auction.state === 2;
  const isSettled = auction.state === 3;
  const isSeller = address?.toLowerCase() === auction.seller.toLowerCase();
  const isWinner =
    address?.toLowerCase() === auction.highestBidder.toLowerCase() &&
    auction.highestBidder !== "0x0000000000000000000000000000000000000000";

  // Calculate time remaining
  const now = Date.now();
  const timeRemaining = Number(auction.auctionEndTime) * 1000 - Date.now();
  const isAuctionActive = timeRemaining > 0;
  
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Ended';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || bidAmount <= 0) return;
    
    setIsSubmitting(true);
    try {
      console.log('Placing encrypted bid:', bidAmount);
      // TODO: Implement FHE bid logic
      alert(`Bid placed: ${bidAmount} ETH`);
    } catch (error) {
      console.error('Error placing bid:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* <AuroraBackground /> */}
      <div className={styles.contentWrapper}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/" className={styles.backButton}>
            <ArrowLeft size={16} />
            Back
          </Link>
          <span>/</span>
          <Link href="/">Home</Link>
          <span>/</span>
          <span className={styles.title}>{auction.title}</span>
        </div>

        {/* Main Content */}
        <div className={styles.container}>
          {/* Left Column - Images */}
          <div className={styles.leftColumn}>
            <div className={styles.mainImage}>
              <img
                src={auction.thumbnails[selectedImage] || auction.mainImage}
                alt={auction.title}
              />
            </div>

            <div className={styles.thumbnails}>
              {auction.thumbnails.map((thumb, index) => (
                <div
                  key={index}
                  className={cx(
                    styles.thumbnail,
                    selectedImage === index && "active"
                  )}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={thumb} alt={`${auction.title} ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            {/* Header Section */}
            <div className={styles.header}>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>{auction.title}</h1>
                <span className={styles.statusBadge}>
                  {isAuctionActive ? "Active" : "Ended"}
                </span>
              </div>

              <p className={styles.info}>
                <span className={styles.infoLabel}>Created by: </span>
                {auction.author}
              </p>

              <p className={styles.info}>
                <span className={styles.infoLabel}>Software: </span>
                {auction.software}
              </p>
            </div>

            {/* Auction Stats */}
            <div className={styles.auctionStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Starting Bid</span>
                <span className={styles.statValue}>
                  {auction.startingBid} ETH
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Time Remaining</span>
                <span className={styles.statValue}>
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Token ID</span>
                <span className={styles.statValue}>#{auction.tokenId}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Contract</span>
                <span className={styles.statValue}>
                  {auction.contractAddress}
                </span>
              </div>
            </div>

            {/* Bid Section */}
            {isAuctionActive && (
              <div className={styles.bidSection}>
                <label className={styles.bidLabel}>
                  Place your encrypted bid (ETH)
                </label>

                <div className={styles.inputWrapper}>
                  <InputNumber
                    value={bidAmount}
                    onChange={(value) => setBidAmount(value as number)}
                    placeholder={`Min: ${auction.startingBid} ETH`}
                    min={parseFloat(auction.startingBid)}
                    step={0.01}
                    precision={2}
                  />
                </div>

                <button
                  className={styles.bidButton}
                  onClick={handlePlaceBid}
                  disabled={
                    !bidAmount ||
                    bidAmount < parseFloat(auction.startingBid) ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? "Submitting..." : "Submit Encrypted Bid"}
                </button>
              </div>
            )}

            {/* Description Section */}
            <div className={styles.descriptionSection}>
              <h3 className={styles.sectionTitle}>Description</h3>
              <p className={styles.description}>{auction.description}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Related Auctions */}
      {relatedAuctions.length > 0 && (
        <div className={styles.relatedSection}>
          <div className={styles.relatedPtl}>
            <div className={styles.relatedTitle}>More auctions</div>
            <div className={styles.relatedGrid}>
              {relatedAuctions.map((item) => {
                const itemTimeRemaining = item.auctionEndsAt - now;
                const isEndingSoon = itemTimeRemaining < 24 * 60 * 60 * 1000;

                return (
                  <AuctionCard
                    key={item.id}
                    id={parseInt(item.id, 10)}
                    title={item.title}
                    type="NFT"
                    currentBid="Encrypted"
                    timeLeft={formatTimeRemaining(itemTimeRemaining)}
                    status={isEndingSoon ? "ending-soon" : "active"}
                    bidders={0}
                    imageUrl={item.image}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}