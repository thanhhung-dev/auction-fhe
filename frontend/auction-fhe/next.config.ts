/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...giữ các config khác nếu có...
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups", // ✅ Cho phép Base Wallet mở Popup
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless", // ✅ Cho phép Zama dùng SharedArrayBuffer
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
