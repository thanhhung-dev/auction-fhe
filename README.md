# Auction FHE

Privacy-preserving sealed-bid auction platform powered by Fully Homomorphic Encryption (FHE). All bids are encrypted client-side and stored on-chain as ciphertext; comparisons and winner determination are performed directly over encrypted data.

**Tech Stack**
- Frontend: Next.js (App Router), React, RainbowKit + wagmi + viem, @lobehub/ui, sonner
- FHE: Zama Relayer SDK (CDN) and fhEVM
- Smart Contract: SimpleFHEAuction on Sepolia

**Default Contract (Sepolia)**
- `0xbF2A26Bad75721e80332455191D435e194382276` (view on Etherscan)

**Code References**
- SDK script: [layout.tsx](file:///c:/Users/Administrator/Desktop/auction-fhe/frontend/auction-fhe/src/app/layout.tsx#L18-L30)
- Contract address config: [addresses.ts](file:///c:/Users/Administrator/Desktop/auction-fhe/frontend/auction-fhe/src/lib/contracts/addresses.ts)
- Bid encryption utilities: [fhe.ts](file:///c:/Users/Administrator/Desktop/auction-fhe/frontend/auction-fhe/src/lib/fhe.ts)
- Auction hooks: [useAuction.ts](file:///c:/Users/Administrator/Desktop/auction-fhe/frontend/auction-fhe/src/hooks/useAuction.ts)
- Bid UI: [AuctionDetails.tsx](file:///c:/Users/Administrator/Desktop/auction-fhe/frontend/auction-fhe/src/components/AuctionDetails.tsx)

**Key Features**
- Create NFT auctions with configurable duration and starting price
- Submit FHE-encrypted bids (anti front-running/MEV)
- End auctions and reveal winners via encrypted evaluation
- Transaction notifications via toast and banner Alert

**Bid Flow Overview**
- Client converts ETH → Gwei, encrypts using Relayer SDK, and gets handle + proof
- Submit handle + proof to the contract: `submitBid(auctionId, handle, proof)`
- Contract compares ciphertext using FHE operations (gt/select)
- On end: mark ciphertext publicly decryptable and verify KMS signatures

## Install & Run

**Requirements**
- Node.js 18+
- Web3 wallet (MetaMask/OKX Wallet)

**Frontend**
```bash
cd frontend/auction-fhe
npm install
npm run dev
```
Open http://localhost:3000

**Build/Start**
```bash
npm run build
npm run start
```

## Configuration

**Contract Address**
- Set the frontend environment variable:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractOnSepolia
```
- If not set, the default value in [addresses.ts](file:///c:/Users/Administrator/Desktop/auction-fhe/frontend/auction-fhe/src/lib/contracts/addresses.ts#L6-L12) is used.

**Relayer SDK**
- The CDN script is embedded in [layout.tsx](file:///c:/Users/Administrator/Desktop/auction-fhe/frontend/auction-fhe/src/app/layout.tsx#L18-L26). Keep it to enable browser-side FHE.

**Wallet Providers**
- Providers and configuration are in [Web3Provider](file:///c:/Users/Administrator/Desktop/auction-fhe/frontend/auction-fhe/src/components/Web3Provider) and [ThemeProvider](file:///c:/Users/Administrator/Desktop/auction-fhe/frontend/auction-fhe/src/components/ThemeProvider).

## Usage Flow

- Navigate to the create page, deploy metadata, and obtain `auctionId`
- On the detail page, enter a bid and click “Submit Encrypted Bid”
- Monitor status and remaining time; watch notifications
- After end time, click “End Auction” to reveal the result

Contract interactions are implemented in [useAuction.ts](file:///c:/Users/Administrator/Desktop/auction-fhe/frontend/auction-fhe/src/hooks/useAuction.ts), while UI is rendered in [AuctionDetails.tsx](file:///c:/Users/Administrator/Desktop/auction-fhe/frontend/auction-fhe/src/components/AuctionDetails.tsx).

## Smart Contract Development

- Hardhat config: [hardhat.config.js](file:///c:/Users/Administrator/Desktop/auction-fhe/hardhat.config.js)
- Contracts and detailed docs: [contracts/README.md](file:///c:/Users/Administrator/Desktop/auction-fhe/contracts/README.md)
- After deployment, update `NEXT_PUBLIC_CONTRACT_ADDRESS`

## Lint

```bash
npm run lint
```

## Resources

- Zama fhEVM: https://docs.zama.ai/fhevm
- fhevm SDK: https://github.com/zama-ai/fhevmjs
- Etherscan Sepolia: https://sepolia.etherscan.io

## License

MIT licensed. See LICENSE for details.
