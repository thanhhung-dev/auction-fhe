"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import { createStyles } from "antd-style";
import WalletButton from "./ButtonWallet/WalletButton";

const useStyles = createStyles(({ css, token }) => ({
  header: css`
    border-bottom: 1px solid ${token.colorBorder};
    background-color: ${token.colorBgLayout};
    backdrop-filter: blur(12px);
  `,
  container: css`
    display: flex;
    align-items: center;
    align-self: stretch;
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
    flex: 1 0 0;
  `,
  logoText: css`
    font-size: 20px;
    font-family: Onest;
    font-weight: 700;
    color: ${token.colorText};
    white-space: nowrap;
  `,
  right: css`
    display: flex;
    align-items: center;
    padding: 12px;
    padding-right: 32px;
    gap: 16px;
    margin-left: auto;
  `,
  nav: css`
    display: flex;
    align-items: center;
    gap: 24px;
  `,
  navLink: css`
    color: #666;
    font-family: Onest;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    gap: 24px;

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
  const { styles, cx } = useStyles();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          {/* LEFT - Logo */}
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoText}>AuctionFHE</span>
          </Link>

          {/* RIGHT - Navigation & Wallet */}
          <div className={styles.right}>
            <nav className={styles.nav}>
              <Link
                href="/"
                className={cx(
                  styles.navLink,
                  (pathname === "/" || pathname === "/auctions") && "active"
                )}
              >
                Explore
              </Link>

              <Link
                href="/create"
                className={cx(
                  styles.navLink,
                  pathname === "/create" && "active"
                )}
              >
                Create
              </Link>

              {isConnected && (
                <Link
                  href="/my-bids"
                  className={cx(
                    styles.navLink,
                    pathname === "/my-bids" && "active"
                  )}
                >
                  My Bids
                </Link>
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
