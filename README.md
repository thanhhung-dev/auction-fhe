# SealedAuction

> Privacy-Preserving Sealed-Bid Auction Platform Powered by Fully Homomorphic Encryption

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Zama fhEVM](https://img.shields.io/badge/fhEVM-0.9.1-blue)](https://docs.zama.ai/fhevm)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Live Demo

| Environment | URL |
|-------------|-----|
| **Production** | https://sealedauction.vercel.app |
| **Contract (Sepolia)** | [`0xbF2A26Bad75721e80332455191D435e194382276`](https://sepolia.etherscan.io/address/0xbF2A26Bad75721e80332455191D435e194382276) |

---

## Overview

SealedAuction is a decentralized sealed-bid auction platform that leverages **Zama's Fully Homomorphic Encryption (FHE)** technology to ensure complete bid privacy. Unlike traditional blockchain auctions where bid amounts are visible on-chain, SealedAuction keeps all bids encrypted throughout the entire auction lifecycle.

### Key Privacy Guarantees

- **Encrypted Bids**: Bid amounts are encrypted client-side using FHE and remain encrypted on-chain
- **No Trusted Third Party**: Cryptographic guarantees replace the need for trusted auctioneers
- **Anti-Front-Running**: Encrypted comparisons prevent MEV attacks and bid sniping
- **Verifiable Fairness**: Auction results are deterministic and auditable without revealing individual bids

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  AuctionList │  │ AuctionDetail│  │   MyBids     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                     │
│         └──────────────────┼──────────────────┘                     │
│                            ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    fhevmjs SDK (v0.6.2)                      │   │
│  │   • createEncryptedInput()  • FHE key management            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Ethereum Sepolia Testnet                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              SimpleFHEAuction Contract                       │   │
│  │   • FHE.fromExternal()   → Convert encrypted input          │   │
│  │   • FHE.gt() / select()  → Encrypted bid comparison         │   │
│  │   • FHE.makePubliclyDecryptable() → Decryption request      │   │
│  │   • FHE.checkSignatures() → KMS verification                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                            │                                        │
│                            ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Zama KMS (Decryption)                      │   │
│  │   • Threshold decryption  • Signature verification          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Smart Contract Architecture

The `SimpleFHEAuction` contract implements a complete sealed-bid auction with the following flow:

```
createAuction() ──► submitBid() ──► endAuction() ──► settleAuction()
      │                  │               │                 │
      ▼                  ▼               ▼                 ▼
  Initialize         FHE.gt()     makePublicly      checkSignatures()
  euint64(0)        FHE.select()   Decryptable()     Reveal winner
```

#### FHE Operations Used

| Operation | Function | Purpose |
|-----------|----------|---------|
| `FHE.asEuint64()` | Initialize | Create encrypted zero for initial highest bid |
| `FHE.fromExternal()` | submitBid | Convert client-encrypted input to euint64 |
| `FHE.allowThis()` | submitBid | Grant contract permission to operate on ciphertext |
| `FHE.gt()` | submitBid | Compare encrypted bids (returns ebool) |
| `FHE.select()` | submitBid | Conditionally update highest bid based on comparison |
| `FHE.makePubliclyDecryptable()` | endAuction | Mark ciphertext for KMS decryption |
| `FHE.checkSignatures()` | settleAuction | Verify KMS decryption proof |

---

## Project Structure

```
SealedAuction/
├── contracts/
│   └── SimpleFHEAuction.sol       # Main FHE auction contract (316 lines)
├── scripts/
│   ├── deploy-simple-auction.js   # Deployment script
│   └── create-auctions.js         # Test auction creation
├── test/
│   ├── SimpleFHEAuction.test.js       # Basic functionality tests (15 tests)
│   ├── SimpleFHEAuction.bid.test.js   # Encrypted bid tests (14 tests)
│   └── SimpleFHEAuction.settle.test.js # Settlement flow tests (13 tests)
├── frontend/
│   └── secure-asset-bid/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Header.tsx         # Navigation with wallet connect
│       │   │   ├── Hero.tsx           # Landing page hero section
│       │   │   ├── FeaturedAuctions.tsx
│       │   │   ├── HowItWorks.tsx     # Demo video & process steps
│       │   │   ├── AuctionCard.tsx    # Auction display component
│       │   │   └── ui/                # shadcn/ui components
│       │   ├── pages/
│       │   │   ├── Index.tsx          # Landing page
│       │   │   ├── AuctionExplorer.tsx # Browse all auctions
│       │   │   ├── AuctionDetail.tsx  # Single auction view + bidding
│       │   │   ├── CreateAuction.tsx  # Auction creation form
│       │   │   └── MyBids.tsx         # User's bid history
│       │   ├── hooks/
│       │   │   ├── useAuction.ts      # Contract interaction hooks
│       │   │   └── use-toast.tsx      # Transaction notifications
│       │   ├── lib/
│       │   │   ├── fhe.ts             # FHE encryption utilities
│       │   │   └── contracts/         # ABI & addresses
│       │   └── config/
│       │       └── wagmi.ts           # Wallet configuration
│       └── package.json
├── hardhat.config.js
└── package.json
```

---

## Technology Stack

### Smart Contracts

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@fhevm/solidity` | 0.9.1 | Zama FHE Solidity library |
| `@fhevm/hardhat-plugin` | 0.3.0-1 | Hardhat FHE integration |
| `@fhevm/mock-utils` | 0.3.0-2 | FHE mock for testing |
| `hardhat` | 2.22.0 | Development framework |
| `@openzeppelin/contracts` | 5.0.0 | Security utilities |
| `ethers` | 6.15.0 | Ethereum library |

### Frontend

| Dependency | Version | Purpose |
|------------|---------|---------|
| `react` | 18.3.1 | UI framework |
| `typescript` | 5.8.3 | Type safety |
| `vite` | 5.4.19 | Build tool |
| `fhevmjs` | 0.6.2 | Client-side FHE encryption |
| `wagmi` | 2.18.2 | React hooks for Ethereum |
| `viem` | 2.38.3 | TypeScript Ethereum library |
| `@rainbow-me/rainbowkit` | 2.2.9 | Wallet connection UI |
| `tailwindcss` | 3.4.17 | Styling |
| `shadcn/ui` | latest | UI components |

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MetaMask or WalletConnect-compatible wallet
- Sepolia testnet ETH ([Faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/SealedAuction.git
cd SealedAuction

# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend/secure-asset-bid
npm install
```

### Environment Configuration

Create `.env` file in root directory:

```env
# Deployment
DEPLOYER_PRIVATE_KEY=0x...
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Optional
ETHERSCAN_API_KEY=...
GAS_LIMIT=8000000
GAS_PRICE=auto
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/SimpleFHEAuction.bid.test.js
```

### Deploy Contract

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Or with custom RPC
SEPOLIA_RPC_URL="https://your-rpc.com" npx hardhat run scripts/deploy-simple-auction.js --network sepolia
```

### Run Frontend

```bash
cd frontend/secure-asset-bid
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Unit Tests

The project includes comprehensive unit tests covering all contract functionality:

### Test Suites

| File | Tests | Coverage |
|------|-------|----------|
| `SimpleFHEAuction.test.js` | 15 | Basic functionality, auction creation, parameter validation |
| `SimpleFHEAuction.bid.test.js` | 14 | FHE encrypted bids, double-bid prevention, multi-user scenarios |
| `SimpleFHEAuction.settle.test.js` | 13 | Auction ending, decryption flow, settlement validation |

### Test Categories

**Basic Functionality**
- Contract deployment
- Auction creation with valid/invalid parameters
- Auction cancellation
- Event emission verification

**FHE Operations**
- `FHE.fromExternal()` - Encrypted input conversion
- `FHE.gt()` - Encrypted greater-than comparison
- `FHE.select()` - Conditional value selection
- `FHE.allowThis()` - Permission management
- `FHE.makePubliclyDecryptable()` - Decryption request

**Edge Cases**
- Zero bid amounts
- Maximum uint64 values
- Rapid sequential operations
- Multiple concurrent auctions

### Running Tests

```bash
# All tests (requires FHEVM mock environment)
npm test

# With verbose output
npx hardhat test --verbose

# Gas reporting
REPORT_GAS=true npm test
```

---

## Auction Lifecycle

### 1. Create Auction

```solidity
function createAuction(uint256 startPrice, uint256 duration) external returns (uint256)
```

- `startPrice`: Minimum acceptable bid (in wei)
- `duration`: Auction length (max 90 days)
- Returns: Auction ID

### 2. Submit Encrypted Bid

```solidity
function submitBid(uint256 auctionId, externalEuint64 encryptedBid, bytes calldata bidProof) external
```

Client-side encryption (TypeScript):
```typescript
const encrypted = await fhevm.createEncryptedInput(contractAddress, userAddress)
  .add64(bidAmountInGwei)
  .encrypt();

await contract.submitBid(auctionId, encrypted.handles[0], encrypted.inputProof);
```

### 3. End Auction

```solidity
function endAuction(uint256 auctionId) external
```

- Can be called by anyone after `endTime`
- Marks highest bid for KMS decryption via `FHE.makePubliclyDecryptable()`

### 4. Settle Auction

```solidity
function settleAuction(
    uint256 auctionId,
    bytes32[] calldata handlesList,
    bytes calldata abiEncodedCleartexts,
    bytes calldata decryptionProof
) external
```

- Requires KMS decryption proof from Relayer SDK
- Verifies signatures via `FHE.checkSignatures()`
- Reveals winning bid amount

---

## Security Considerations

### Privacy Guarantees

| Aspect | Protection |
|--------|------------|
| Bid amounts | Encrypted with FHE (euint64) |
| Bid comparison | Computed on encrypted values |
| Winner determination | Encrypted until settlement |
| Bidder identity | Visible on-chain (addresses) |

### Known Limitations

1. **Bidder Addresses**: While bid amounts are encrypted, bidder addresses are public
2. **Timing Metadata**: Bid timestamps are visible
3. **Gas Costs**: FHE operations have higher gas costs than plaintext operations
4. **Bid Amount Precision**: Using Gwei (10^9) instead of Wei to fit in uint64

### Audit Status

This is a demonstration project. **Not audited for production use.**

---

## API Reference

### Contract Functions

| Function | Access | Description |
|----------|--------|-------------|
| `createAuction(startPrice, duration)` | Public | Create new auction |
| `submitBid(auctionId, encryptedBid, proof)` | Public | Submit encrypted bid |
| `endAuction(auctionId)` | Public | End auction after time expires |
| `settleAuction(auctionId, handles, cleartexts, proof)` | Public | Settle with KMS proof |
| `cancelAuction(auctionId)` | Seller only | Cancel before any bids |
| `getAuction(auctionId)` | View | Get auction details |
| `hasUserBid(auctionId, user)` | View | Check if user has bid |
| `getTotalAuctions()` | View | Get auction count |
| `getHighestBidHandle(auctionId)` | View | Get encrypted bid handle (after end) |

### Events

```solidity
event AuctionCreated(uint256 indexed auctionId, address indexed seller, uint256 startPrice, uint256 startTime, uint256 endTime);
event BidSubmitted(uint256 indexed auctionId, address indexed bidder, uint256 timestamp);
event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 timestamp);
event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 winningBid);
event AuctionCancelled(uint256 indexed auctionId);
```

---

## Development Roadmap

### Phase 1: Bidding (Completed)
- [x] FHE-encrypted bid submission
- [x] Encrypted bid comparison
- [x] Auction creation and management
- [x] Frontend with wallet integration

### Phase 2: Full Platform (In Progress)
- [ ] Auction creation UI with asset upload
- [ ] Winner claim mechanism
- [ ] Bid history dashboard
- [ ] Multi-asset support (ERC-721, ERC-1155)

### Phase 3: Advanced Features
- [ ] Dutch auction support
- [ ] Reserve price (encrypted)
- [ ] Batch settlement
- [ ] Analytics dashboard

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Resources

- [Zama fhEVM Documentation](https://docs.zama.ai/fhevm)
- [fhevmjs SDK](https://github.com/zama-ai/fhevmjs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Sepolia Testnet Faucet](https://sepoliafaucet.com/)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Zama](https://zama.ai/) for the FHE technology
- [OpenZeppelin](https://openzeppelin.com/) for security patterns
- [shadcn/ui](https://ui.shadcn.com/) for UI components
