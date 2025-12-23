'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';
import { createStyles } from 'antd-style';
import WalletButton from './ButtonWallet/WalletButton';

const useStyles = createStyles(({ css, token }) => ({
  header: css`
    border-bottom: 1px solid ${token.colorBorder};
    background-color: ${token.colorBgLayout};
    backdrop-filter: blur(12px);
  `,
  container: css`
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  `,
  wrapper: css`
    display: flex;
    width: 100%;
    height: 64px;
    align-items: center;
    justify-content: space-between;
  `,
  logoLink: css`
    display: flex;
    padding: 12px;
    align-items: center;
  `,
  logoText: css`
    font-size: 20px;
    font-weight: 700;
    color: ${token.colorText};
  `,
  right: css`
    display: flex;
    align-items: center;
    gap: 16px;
  `,
  nav: css`
    display: flex;
    align-items: center;
    gap: 24px;
  `,
  navLink: css`
    font-size: 14px;
    font-weight: 500;
    color: ${token.colorTextSecondary};
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: ${token.colorPrimary};
    }

    &.active {
      color: ${token.colorPrimary};
    }
  `,
}));

const NavBar = () => {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const isHome = pathname === '/';
  const { styles, cx } = useStyles();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          {/* LEFT */}
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoText}>AuctionFHE</span>
          </Link>

          {/* RIGHT */}
          <div className={styles.right}>
            <nav className={styles.nav}>
              <Link
                href="/"
                className={cx(styles.navLink, pathname === '/auctions' && 'active')}
              >
                Auctions
              </Link>

              <Link
                href="/create"
                className={cx(styles.navLink, pathname === '/create' && 'active')}
              >
                Create
              </Link>

              {isConnected && (
                <Link
                  href="/my-bids"
                  className={cx(styles.navLink, pathname === '/my-bids' && 'active')}
                >
                  My Bids
                </Link>
              )}

              {isHome && (
                <a href="#how-it-works" className={styles.navLink}>
                  How It Works
                </a>
              )}
            </nav>

            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
