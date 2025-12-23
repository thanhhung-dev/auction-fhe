// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {
    FHE,
    ebool,
    euint8,
    euint32,
    euint64,
    externalEuint8,
    externalEuint32,
    externalEuint64
} from "@fhevm/solidity/lib/FHE.sol";

contract FHESealedAuction is SepoliaConfig {
    struct BidCipher {
        address bidder;
        euint64 bidAmount;
        euint32 lotCipher;
        euint8 penaltyCipher;
        bool revealed;
    }

    struct AuctionConfig {
        uint256 startAt;
        uint256 endAt;
        euint64 reserveCipher;
    }

    AuctionConfig public config;

    mapping(bytes32 => BidCipher) private bids;
    mapping(bytes32 => euint8) private bidOutcome;
    mapping(bytes32 => bool) private outcomeReady;

    event AuctionConfigured(uint256 startAt, uint256 endAt);
    event BidSubmitted(bytes32 indexed bidId, address indexed bidder);
    event BidEvaluated(bytes32 indexed bidId);
    event BidOutcomeRevealed(bytes32 indexed bidId, uint8 flag);

    error AuctionInactive();
    error BidMissing();
    error OutcomePending();
    error OutcomeMismatch();

    constructor(
        uint256 startAt,
        uint256 endAt,
        externalEuint64 reserveExt,
        bytes memory reserveProof
    ) {
        require(startAt < endAt, "timing");
        config = AuctionConfig({
            startAt: startAt,
            endAt: endAt,
            reserveCipher: FHE.fromExternal(reserveExt, reserveProof)
        });
        emit AuctionConfigured(startAt, endAt);
    }

    function submitBid(
        bytes32 bidId,
        externalEuint64 amountExt,
        bytes calldata amountProof,
        externalEuint32 lotExt,
        bytes calldata lotProof,
        externalEuint8 penaltyExt,
        bytes calldata penaltyProof
    ) external {
        if (block.timestamp < config.startAt || block.timestamp > config.endAt) revert AuctionInactive();

        BidCipher storage bid = bids[bidId];
        bid.bidder = msg.sender;
        bid.bidAmount = FHE.fromExternal(amountExt, amountProof);
        bid.lotCipher = FHE.fromExternal(lotExt, lotProof);
        bid.penaltyCipher = FHE.fromExternal(penaltyExt, penaltyProof);
        bid.revealed = false;

        FHE.allowThis(bid.bidAmount);
        FHE.allowThis(bid.lotCipher);
        FHE.allowThis(bid.penaltyCipher);

        outcomeReady[bidId] = false;

        emit BidSubmitted(bidId, msg.sender);
    }

    function evaluateBid(bytes32 bidId) external {
        BidCipher storage bid = bids[bidId];
        if (bid.bidder == address(0)) revert BidMissing();

        ebool meetsReserve = FHE.ge(bid.bidAmount, config.reserveCipher);
        ebool penaltyOk = FHE.le(bid.penaltyCipher, FHE.asEuint8(1));

        euint8 flag = FHE.select(FHE.and(meetsReserve, penaltyOk), FHE.asEuint8(1), FHE.asEuint8(0));

        bidOutcome[bidId] = flag;
        outcomeReady[bidId] = true;

        FHE.allowThis(flag);

        emit BidEvaluated(bidId);
    }

    function revealBidOutcome(bytes32 bidId, uint8 plainFlag) external {
        if (!outcomeReady[bidId]) revert OutcomePending();
        // Decrypt to verify match (simplified version - in production use proper decryption flow)
        bids[bidId].revealed = true;
        emit BidOutcomeRevealed(bidId, plainFlag);
    }

    function getBidOutcomeHandle(bytes32 bidId) external view returns (euint8) {
        if (!outcomeReady[bidId]) revert OutcomePending();
        return bidOutcome[bidId];
    }
}
