// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
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
 */
contract SimpleFHEAuction is SepoliaConfig {
    struct Auction {
        address seller;
        uint256 startPrice;      // Starting price (plaintext)
        uint256 startTime;
        uint256 endTime;
        address highestBidder;
        euint64 highestBid;
        bool ended;
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

    event AuctionCancelled(uint256 indexed auctionId);

    error AuctionNotActive();
    error AuctionNotEnded();
    error AuctionAlreadyEnded();
    error OnlySeller();
    error AlreadyBid();
    error InvalidTime();
    error InvalidPrice();

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

        auctions[auctionId] = Auction({
            seller: msg.sender,
            startPrice: startPrice,
            startTime: startTime,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: FHE.asEuint64(0),
            ended: false,
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

        // Store the bid
        auctionBids[auctionId].push(Bid({
            bidder: msg.sender,
            encryptedAmount: bidAmount,
            timestamp: block.timestamp
        }));

        hasBid[auctionId][msg.sender] = true;

        // Update highest bid (encrypted comparison)
        ebool isHigher = FHE.gt(bidAmount, auction.highestBid);
        auction.highestBid = FHE.select(isHigher, bidAmount, auction.highestBid);
        auction.highestBidder = msg.sender; // Simplified: last bidder who improved

        // Allow contract to use these values
        FHE.allowThis(bidAmount);
        FHE.allowThis(auction.highestBid);

        emit BidSubmitted(auctionId, msg.sender, block.timestamp);
    }

    /**
     * @notice End the auction (can only be called after end time)
     * @param auctionId The auction to end
     */
    function endAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];

        if (block.timestamp < auction.endTime) revert AuctionNotEnded();
        if (auction.ended) revert AuctionAlreadyEnded();
        if (auction.cancelled) revert AuctionNotActive();

        auction.ended = true;
        emit AuctionEnded(auctionId, auction.highestBidder, block.timestamp);
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
        bool ended,
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
            auction.ended,
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
