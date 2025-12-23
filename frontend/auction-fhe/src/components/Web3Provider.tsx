'use client';

import React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { config } from '@/config/wagmi';
import { theme } from 'antd'; // ✅ Import đúng cách

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const { token } = theme.useToken();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={lightTheme({
            accentColor: token.colorPrimary,
            accentColorForeground: token.colorTextLightSolid,
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}