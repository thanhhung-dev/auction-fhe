import { createStyles } from "antd-style";

export const useStyles = createStyles(({ css, token }) => ({
  card: css`
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 16px;
    place-content: center;
    height: min-content;
    padding: 0;
    position: relative;
    overflow: hidden;
    cursor: pointer;
  `,

  imageWrapper: css`
    width: 100%;
    aspect-ratio: 1;
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
  `,

  badge: css`
    position: absolute;
    top: 12px;
    left: 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    color: white;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 2px;
    text-transform: uppercase;
    border-radius: 8px;
    
    &.auction-live {
      background: rgba(81, 81, 81, 0.9);
    }
    
    &.auction-ended {
      background: rgba(248, 248, 248, 0.9);
    }
  `,

  label: css`
    color: ${token.colorTextSecondary};
    display: flex;
    align-items: center;
    gap: 6px;
  `,

  content: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,

  titleRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  `,

  title: css`
    color: ${token.colorTextHeading};
    font-size: 18px;
    font-weight: 500;
    line-height: 1.4;
    margin: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,

  // Tags (Free, Pro)
  freeTag: css`
    display: inline-flex;
    padding: 6px 12px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    background: rgba(132, 132, 132, 0.2);
    border: 1px solid rgba(198, 198, 198, 0.3);
    border-radius: 8px;
    flex-shrink: 0;
  `,

  proTag: css`
    display: inline-flex;
    padding: 6px 12px;
    color: white;
    font-size: 13px;
    font-weight: 600;
    background: #AD1FFF;
    border-radius: 8px;
    flex-shrink: 0;
  `,

  // Price Section (for regular products)
  priceRow: css`
    display: flex;
    align-items: center;
  `,

  price: css`
    font-size: 16px;
    font-weight: 600;
    color: #999;
    line-height: 1.5;
  `,

  // Auction Info Section
  auctionInfo: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 8px;
  `,

  infoRow: css`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #999;
    
    svg {
      width: 14px;
      height: 14px;
    }
  `,

  encryptedValue: css`
    color:rgb(144, 144, 144);
    font-weight: 600;
  `,

  timeLeft: css`
    display: flex;
    align-items: center;
    gap: 6px;
    color: #f59e0b;
    font-size: 13px;
    font-weight: 500;
    
    &.ended {
      color: #ef4444;
    }
  `,
  primaryValue: css`
    font-weight: 600;
    color: #666;
    font-size: 18px;
  `,
}));