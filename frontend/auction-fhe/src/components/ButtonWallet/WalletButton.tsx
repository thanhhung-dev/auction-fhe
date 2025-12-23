'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ css, token }) => ({
  button: css`
    height: 40px;
    padding: 0 16px;

    background: #ffffffff;
    color: #000000ff;
    font-family: Onest;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 16px; /* 100% */
    border-radius: 8px;
    font-weight: 600;
    border: none;
    cursor: pointer;
  `,
}));

const WalletButton = () => {
  const { styles } = useStyles();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        if (!mounted) return null;

        if (!account) {
          return (
            <button
              className={styles.button}
              onClick={openConnectModal}
            >
              Connect Wallet
            </button>
          );
        }

        if (chain?.unsupported) {
          return (
            <button
              className={styles.button}
              onClick={openChainModal}
            >
              Wrong Network
            </button>
          );
        }

        return (
          <button
            className={styles.button}
            onClick={openAccountModal}
          >
            {account.displayName}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletButton;
