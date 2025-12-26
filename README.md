# AuctionFHE

> Privacy-Preserving Sealed-Bid Auction Platform Powered by Fully Homomorphic Encryption



## Live Demo

| Environment | URL |
|-------------|-----|
| **Production** | [https://sealedauction.vercel.app](https://auction-fhe.vercel.app/) |
| **Video** |  https://www.youtube.com/watch?v=7zvHBWoC1Ug
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
│                          Nextjs (React)                           │
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
