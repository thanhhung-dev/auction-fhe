// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {
    FHE,
    ebool,
    euint64,
    externalEuint64
} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title SimpleFHEAuction
 * @notice Simple sealed-bid auction using FHE encryption
 * @dev Bids are encrypted, only highest bid is revealed at auction end
 * @dev Updated for fhEVM 0.9.1 - using ZamaEthereumConfig with proper decryption flow
 *
 * Decryption Flow (fhEVM 0.9.1):
 * 1. endAuction() - marks highestBid for public decryption via FHE.makePubliclyDecryptable()
 * 2. Off-chain: call publicDecrypt(handles) via Relayer SDK to get KMS signatures
 * 3. settleAuction() - verify KMS signatures via FHE.checkSignatures() and finalize
 */
contract SimpleFHEAuction is ZamaEthereumConfig {
    struct Auction {
        address seller;
        uint256 startPrice;      // Starting price (plaintext)
        uint256 startTime;
        uint256 endTime;
        address highestBidder;
        euint64 highestBid;
        uint256 revealedHighestBid;  // Decrypted highest bid (after settlement)
        bool ended;
        bool settled;
        bool cancelled;
    }

    struct Bid {
        address bidder;
        euint64 encryptedAmount;
        uint256 timestamp;
    }

    uint256 public auctionCounter;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(uint256 => mapping(address => bool)) public hasBid;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 startPrice,
        uint256 startTime,
        uint256 endTime
    );

    event BidSubmitted(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 timestamp
    );

    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 timestamp
    );

    event AuctionSettled(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid
    );

    event AuctionCancelled(uint256 indexed auctionId);

    error AuctionNotActive();
    error AuctionNotEnded();
    error AuctionAlreadyEnded();
    error AuctionAlreadySettled();
    error AuctionNotEndedYet();
    error OnlySeller();
    error AlreadyBid();
    error InvalidTime();
    error InvalidPrice();
    error InvalidDecryptionProof();

    /**
     * @notice Create a new auction
     * @param startPrice Starting price in wei (plaintext)
     * @param duration Auction duration in seconds
     */
    function createAuction(
        uint256 startPrice,
        uint256 duration
    ) external returns (uint256) {
        if (duration == 0 || duration > 90 days) revert InvalidTime();
        if (startPrice == 0) revert InvalidPrice();

        uint256 auctionId = auctionCounter++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        // Initialize highest bid with encrypted zero and grant permission
        euint64 initialHighestBid = FHE.asEuint64(0);
        FHE.allowThis(initialHighestBid);

        auctions[auctionId] = Auction({
            seller: msg.sender,
            startPrice: startPrice,
            startTime: startTime,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: initialHighestBid,
            revealedHighestBid: 0,
            ended: false,
            settled: false,
            cancelled: false
        });

        emit AuctionCreated(auctionId, msg.sender, startPrice, startTime, endTime);
        return auctionId;
    }

    /**
     * @notice Submit encrypted bid
     * @param auctionId The auction to bid on
     * @param encryptedBid Encrypted bid amount from client (in Gwei to fit euint64)
     * @param bidProof Proof for the encrypted bid
     * @dev Bid amount is encrypted in Gwei units (1 ETH = 1e9 Gwei) to fit in 64-bit integer
     */
    function submitBid(
        uint256 auctionId,
        externalEuint64 encryptedBid,
        bytes calldata bidProof
    ) external {
        Auction storage auction = auctions[auctionId];

        if (block.timestamp < auction.startTime || block.timestamp > auction.endTime) {
            revert AuctionNotActive();
        }
        if (auction.ended || auction.cancelled) revert AuctionNotActive();
        if (hasBid[auctionId][msg.sender]) revert AlreadyBid();

        // Convert external encrypted input to euint64
        euint64 bidAmount = FHE.fromExternal(encryptedBid, bidProof);

        // Grant permission to use the encrypted bid BEFORE any FHE operations
        FHE.allowThis(bidAmount);

        // Store the bid
        auctionBids[auctionId].push(Bid({
            bidder: msg.sender,
            encryptedAmount: bidAmount,
            timestamp: block.timestamp
        }));

        hasBid[auctionId][msg.sender] = true;

        // Update highest bid (encrypted comparison)
        ebool isHigher = FHE.gt(bidAmount, auction.highestBid);
        euint64 newHighestBid = FHE.select(isHigher, bidAmount, auction.highestBid);
        FHE.allowThis(newHighestBid);
        auction.highestBid = newHighestBid;
        auction.highestBidder = msg.sender; // Simplified: last bidder who improved

        emit BidSubmitted(auctionId, msg.sender, block.timestamp);
    }

    /**
     * @notice End the auction and mark highest bid for decryption
     * @param auctionId The auction to end
     * @dev Step 1 of decryption flow: marks the encrypted highest bid for public decryption
     * @dev After calling this, use Relayer SDK's publicDecrypt() off-chain to get KMS signatures
     */
    function endAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];

        if (block.timestamp < auction.endTime) revert AuctionNotEnded();
        if (auction.ended) revert AuctionAlreadyEnded();
        if (auction.cancelled) revert AuctionNotActive();

        auction.ended = true;

        // Step 1: Mark the encrypted highest bid for public decryption
        // This allows KMS to decrypt it when requested via Relayer SDK
        FHE.makePubliclyDecryptable(auction.highestBid);

        emit AuctionEnded(auctionId, auction.highestBidder, block.timestamp);
    }

    /**
     * @notice Settle the auction with decryption proof from KMS
     * @param auctionId The auction to settle
     * @param handlesList Array of ciphertext handles as bytes32 (order matters!)
     * @param abiEncodedCleartexts ABI-encoded decrypted values (uint64 padded to 32 bytes)
     * @param decryptionProof KMS signature proof
     * @dev Step 3 of decryption flow: verifies KMS signatures and finalizes auction
     * @dev The handlesList order must match the order used in publicDecrypt()
     * @dev abiEncodedCleartexts format: each cleartext is padded to 32 bytes, concatenated
     */
    function settleAuction(
        uint256 auctionId,
        bytes32[] calldata handlesList,
        bytes calldata abiEncodedCleartexts,
        bytes calldata decryptionProof
    ) external {
        Auction storage auction = auctions[auctionId];

        if (!auction.ended) revert AuctionNotEndedYet();
        if (auction.settled) revert AuctionAlreadySettled();
        if (auction.cancelled) revert AuctionNotActive();

        // Validate the handles list contains the expected handle
        if (handlesList.length < 1) revert InvalidDecryptionProof();

        // Convert calldata to memory for FHE.checkSignatures
        bytes32[] memory handlesMemory = new bytes32[](handlesList.length);
        for (uint256 i = 0; i < handlesList.length; i++) {
            handlesMemory[i] = handlesList[i];
        }

        // Step 3: Verify KMS signatures - reverts if invalid
        // checkSignatures only verifies, it doesn't return values
        FHE.checkSignatures(
            handlesMemory,
            abiEncodedCleartexts,
            decryptionProof
        );

        // Decode the cleartext from abiEncodedCleartexts
        // Format: each value is ABI-encoded as 32 bytes
        uint256 winningBid;
        assembly {
            // Load the first 32 bytes from abiEncodedCleartexts (after length prefix in calldata)
            winningBid := calldataload(add(abiEncodedCleartexts.offset, 0))
        }

        // Store the revealed highest bid
        auction.revealedHighestBid = winningBid;
        auction.settled = true;

        emit AuctionSettled(auctionId, auction.highestBidder, winningBid);
    }

    /**
     * @notice Get the encrypted highest bid handle for decryption
     * @param auctionId The auction ID
     * @return handle The ciphertext handle to use with publicDecrypt()
     * @dev Use this to get the handle needed for off-chain decryption via Relayer SDK
     */
    function getHighestBidHandle(uint256 auctionId) external view returns (euint64) {
        Auction storage auction = auctions[auctionId];
        if (!auction.ended) revert AuctionNotEndedYet();
        return auction.highestBid;
    }

    /**
     * @notice Cancel auction (only seller, only before any bids)
     * @param auctionId The auction to cancel
     */
    function cancelAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];

        if (msg.sender != auction.seller) revert OnlySeller();
        if (auctionBids[auctionId].length > 0) revert AuctionNotActive();
        if (auction.ended) revert AuctionAlreadyEnded();

        auction.cancelled = true;
        emit AuctionCancelled(auctionId);
    }

    /**
     * @notice Get auction details
     */
    function getAuction(uint256 auctionId) external view returns (
        address seller,
        uint256 startPrice,
        uint256 startTime,
        uint256 endTime,
        address highestBidder,
        uint256 revealedHighestBid,
        bool ended,
        bool settled,
        bool cancelled,
        uint256 bidCount
    ) {
        Auction storage auction = auctions[auctionId];
        return (
            auction.seller,
            auction.startPrice,
            auction.startTime,
            auction.endTime,
            auction.highestBidder,
            auction.revealedHighestBid,
            auction.ended,
            auction.settled,
            auction.cancelled,
            auctionBids[auctionId].length
        );
    }

    /**
     * @notice Check if user has bid on auction
     */
    function hasUserBid(uint256 auctionId, address user) external view returns (bool) {
        return hasBid[auctionId][user];
    }

    /**
     * @notice Get total number of auctions
     */
    function getTotalAuctions() external view returns (uint256) {
        return auctionCounter;
    }
}
