'use client';
import { createStyles } from 'antd-style';
import Link from 'next/link';

const useStyles = createStyles(({ css, token }) => ({
  cardLink: css`
    text-decoration: none;
    display: block;
  `,
  card: css`
    display: flex;
    width: 373.33px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 16px;
  `,
  imageWrapper: css`
    background: ${token.colorBgContainer};
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    border-radius: 12px;
    justify-content: center;

    img {
      width: 373.33px;
      height: 373.33px;
    }
  `,
  content: css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    align-self: stretch;
  `,
  titleRow: css`
    display: flex;
    align-items: center;
    width: 100%;
  `,
  title: css`
    font-family: Onest, sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: ${token.colorText};
    font-style: normal;
    font-weight: 400;
    line-height: 27px;
    flex: 1;
    margin: 0;
  `,
  statusTag: css`
    background: #e3e3e3;
    padding: 8px;
    border-radius: 8px;
    justify-content: center;
    align-items: center;
    color: #000;
    font-family: Onest;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 14px;
  `,
  primaryValue: css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-self: stretch;
    color: #666;
    font-family: Onest, sans-serif;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 27px;
  `,
}));

interface AuctionCardProps {
  id?: number;
  title: string;
  type: 'DeFi Debt' | 'NFT' | 'Token';
  currentBid: string;
  timeLeft: string;
  status: 'active' | 'ending-soon';
  bidders: number;
  imageUrl?: string;
}

export default function AuctionCard({
  id,
  title,
  currentBid,
  status,
  imageUrl,
}: AuctionCardProps) {
  const { styles } = useStyles();

  const CardContent = (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {imageUrl ? <img src={imageUrl} alt={title} /> : <div>🔒</div>}
      </div>
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{title}</h3>
          <div
            className={styles.statusTag}
          >
            {status === 'active' ? 'Active' : 'Ending Soon'}
          </div>
        </div>
        <span className={styles.primaryValue}>{currentBid}</span>
      </div>
    </div>
  );

  return id ? (
    <Link href={`/auction/${id}`} className={styles.cardLink} prefetch={false}>
      {CardContent}
    </Link>
  ) : (
    CardContent
  );
}