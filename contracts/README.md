# FHE Auction Platform Smart Contracts

Privacy-preserving auction smart contracts using Zama's Fully Homomorphic Encryption (FHE) technology.

## Overview

This repository contains the smart contract implementation for a decentralized auction platform that maintains bid privacy throughout the auction process using FHE. The platform supports multiple auction types while ensuring that bid amounts remain encrypted until necessary.

## Features

### Auction Types

1. **Sealed-Bid (Vickrey) Auction** (`FHESealedBidAuction.sol`)
   - Second-price sealed-bid auction
   - Winner pays second-highest bid
   - Complete bid privacy until reveal phase
   - Automatic second-price determination using FHE

2. **English Auction** (`FHEEnglishAuction.sol`)
   - Traditional ascending price auction
   - Incremental bidding with encrypted amounts
   - Anti-sniping protection with automatic extensions
   - Real-time highest bid tracking (encrypted)

3. **Dutch Auction** (`FHEDutchAuction.sol`)
   - Descending price auction
   - Instant buy functionality
   - Price decrements over time
   - Encrypted price calculations

4. **Batch Auction** (`FHEBatchAuction.sol`)
   - Multiple items in single auction
   - Combined bidding support
   - Individual item settlement
   - Efficient gas usage for bulk auctions

### Core Features

- **Complete Privacy**: All bid amounts remain encrypted using FHE
- **Homomorphic Operations**: Bid comparisons and calculations performed on encrypted data
- **Anti-Sniping Protection**: Automatic auction extensions for late bids
- **Deposit Management**: Secure escrow and automatic refunds
- **NFT Support**: Full ERC721 compatibility
- **Platform Fees**: Configurable commission system
- **Emergency Controls**: Pause functionality and admin controls

## Architecture

```
contracts/
├── src/
│   ├── IFHEAuction.sol           # Interface definitions
│   ├── FHEAuctionBase.sol        # Base contract with shared functionality
│   ├── FHESealedBidAuction.sol   # Vickrey auction implementation
│   ├── FHEEnglishAuction.sol     # English auction implementation
│   ├── FHEDutchAuction.sol       # Dutch auction implementation
│   ├── FHEBatchAuction.sol       # Batch auction implementation
│   └── SampleNFT.sol              # Sample NFT for testing
├── scripts/
│   └── deploy.js                  # Deployment script
├── test/
│   └── FHEAuction.test.js        # Test suite
├── hardhat.config.js              # Hardhat configuration
└── package.json                   # Dependencies

```

## Installation

1. Clone the repository:
```bash
cd /Users/songsu/Desktop/zama/fhe-auction/contracts
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Deployment

### Local Development

1. Start local node:
```bash
npm run node
```

2. Deploy contracts:
```bash
npm run deploy:local
```

### Zama Devnet

```bash
npm run deploy:devnet
```

### Sepolia Testnet

```bash
npm run deploy:sepolia
```

## Testing

Run the test suite:
```bash
npm test
```

Run with gas reporting:
```bash
REPORT_GAS=true npm test
```

Run coverage analysis:
```bash
npm run coverage
```

## Contract Addresses

Deployment addresses are saved in `deployments/` directory after each deployment.

## FHE Operations

### Encrypted Bid Submission

```solidity
// Create encrypted bid
euint32 encryptedBid = TFHE.asEuint32(bidAmount);

// Submit to auction
auction.placeBid(auctionId, encryptedBid, inputProof);
```

### Homomorphic Comparison

```solidity
// Compare bids without decryption
ebool isHigher = TFHE.gt(newBid, currentHighestBid);
```

### Secure Winner Determination

```solidity
// Determine winner while maintaining privacy
auction.revealWinner(auctionId);
```

## Security Considerations

1. **Reentrancy Protection**: All external calls use checks-effects-interactions pattern
2. **Access Control**: Role-based permissions for sensitive operations
3. **Overflow Protection**: Solidity 0.8.24 with built-in overflow checks
4. **Pause Mechanism**: Emergency pause functionality for critical issues
5. **Time Manipulation**: Anti-sniping and time-based validations

## Gas Optimization

- Efficient storage patterns
- Batch operations where possible
- Optimized FHE operations
- Minimal external calls

## API Reference

### Creating an Auction

```solidity
function createAuction(
    address tokenContract,
    uint256 tokenId,
    uint256 startTime,
    uint256 endTime,
    euint32 reservePrice,
    bytes calldata encryptedReservePrice
) external returns (uint256 auctionId)
```

### Placing a Bid

```solidity
function placeBid(
    uint256 auctionId,
    euint32 encryptedBid,
    bytes calldata inputProof
) external payable
```

### Claiming Items

```solidity
function claimItem(uint256 auctionId) external
```

### Claiming Refunds

```solidity
function claimRefund(uint256 auctionId) external
```

## Development

### Compile Contracts

```bash
npm run compile
```

### Format Code

```bash
npm run format
```

### Lint Contracts

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-org/fhe-auction/issues)
- Documentation: [https://docs.fheauction.io](https://docs.fheauction.io)

## Acknowledgments

- Zama for FHE technology and fhEVM
- OpenZeppelin for secure contract libraries
- Hardhat for development framework