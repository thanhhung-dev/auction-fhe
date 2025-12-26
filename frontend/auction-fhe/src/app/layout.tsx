import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import CustomLayout from "@/components/CustomLayout";
import ThemeProvider from "@/components/ThemeProvider";
import { Providers } from "@/components/Web3Provider";
import Script from "next/script";
import AuctionMetadataSeeder from "@/components/AuctionMetadataSeeder";

// 1. Import App từ antd
import { App } from "antd";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Auction-FHE",
  description: "Fully Homomorphic Encryption Auction Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </head>

      <body
        className={`${onest.variable} antialiased`}
        style={{ margin: 0, padding: 0 }}
      >
        <Providers>
          <ThemeProvider themeMode="dark">
            {/* 2. Bọc nội dung bên trong <App> */}
            <App>
              <AuctionMetadataSeeder />
              <CustomLayout>{children}</CustomLayout>
            </App>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
