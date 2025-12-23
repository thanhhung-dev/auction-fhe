import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'FHE Sealed Bid Auction',
  projectId: 'b24630b254ec325173f0fb1bbb1f28cd', // WalletConnect Cloud
  chains: [sepolia],
  ssr: false,
});
