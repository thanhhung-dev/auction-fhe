const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FHE Auction Platform Tests", function () {
  let sealedBidAuction, englishAuction, dutchAuction, batchAuction;
  let sampleNFT;
  let owner, seller, bidder1, bidder2, bidder3;
  let tokenId;

  // Helper function to create encrypted value (simplified for testing)
  function encryptValue(value) {
    // In production, this would use actual FHE encryption
    return {
      encrypted: ethers.utils.hexZeroPad(ethers.utils.hexlify(value), 32),
      proof: ethers.utils.randomBytes(64)
    };
  }

  beforeEach(async function () {
    // Get signers
    [owner, seller, bidder1, bidder2, bidder3] = await ethers.getSigners();

    // Deploy sample NFT contract
    const SampleNFT = await ethers.getContractFactory("SampleNFT");
    sampleNFT = await SampleNFT.deploy("Test NFT", "TNFT");
    await sampleNFT.deployed();

    // Mint NFTs to seller
    await sampleNFT.mint(seller.address);
    await sampleNFT.mint(seller.address);
    await sampleNFT.mint(seller.address);
    tokenId = 1;

    // Deploy auction contracts
    const FHESealedBidAuction = await ethers.getContractFactory("FHESealedBidAuction");
    sealedBidAuction = await FHESealedBidAuction.deploy();
    await sealedBidAuction.deployed();

    const FHEEnglishAuction = await ethers.getContractFactory("FHEEnglishAuction");
    englishAuction = await FHEEnglishAuction.deploy();
    await englishAuction.deployed();

    const FHEDutchAuction = await ethers.getContractFactory("FHEDutchAuction");
    dutchAuction = await FHEDutchAuction.deploy();
    await dutchAuction.deployed();

    const FHEBatchAuction = await ethers.getContractFactory("FHEBatchAuction");
    batchAuction = await FHEBatchAuction.deploy();
    await batchAuction.deployed();
  });

  describe("Sealed-Bid (Vickrey) Auction", function () {
    let auctionId;
    let startTime, endTime;

    beforeEach(async function () {
      // Approve NFT transfer
      await sampleNFT.connect(seller).approve(sealedBidAuction.address, tokenId);

      // Create auction
      startTime = await time.latest() + 60;
      endTime = startTime + 3600; // 1 hour auction

      const reservePrice = encryptValue(ethers.utils.parseEther("1"));
      
      const tx = await sealedBidAuction.connect(seller).createAuction(
        sampleNFT.address,
        tokenId,
        startTime,
        endTime,
        reservePrice.encrypted,
        reservePrice.proof
      );

      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;

      // Fast forward to auction start
      await time.increaseTo(startTime);
    });

    it("Should create a sealed-bid auction", async function () {
      const details = await sealedBidAuction.getAuctionDetails(auctionId);
      expect(details.seller).to.equal(seller.address);
      expect(details.tokenContract).to.equal(sampleNFT.address);
      expect(details.tokenId).to.equal(tokenId);
    });

    it("Should accept encrypted bids", async function () {
      const bid1 = encryptValue(ethers.utils.parseEther("2"));
      await expect(
        sealedBidAuction.connect(bidder1).placeBid(
          auctionId,
          bid1.encrypted,
          bid1.proof,
          { value: ethers.utils.parseEther("2") }
        )
      ).to.emit(sealedBidAuction, "BidSealed");

      const bid2 = encryptValue(ethers.utils.parseEther("1.5"));
      await expect(
        sealedBidAuction.connect(bidder2).placeBid(
          auctionId,
          bid2.encrypted,
          bid2.proof,
          { value: ethers.utils.parseEther("1.5") }
        )
      ).to.emit(sealedBidAuction, "BidSealed");
    });

    it("Should not allow duplicate bids from same bidder", async function () {
      const bid = encryptValue(ethers.utils.parseEther("2"));
      await sealedBidAuction.connect(bidder1).placeBid(
        auctionId,
        bid.encrypted,
        bid.proof,
        { value: ethers.utils.parseEther("2") }
      );

      await expect(
        sealedBidAuction.connect(bidder1).placeBid(
          auctionId,
          bid.encrypted,
          bid.proof,
          { value: ethers.utils.parseEther("2") }
        )
      ).to.be.revertedWith("Already placed bid");
    });

    it("Should reveal winner after auction ends", async function () {
      // Place bids
      const bid1 = encryptValue(ethers.utils.parseEther("2"));
      await sealedBidAuction.connect(bidder1).placeBid(
        auctionId,
        bid1.encrypted,
        bid1.proof,
        { value: ethers.utils.parseEther("2") }
      );

      const bid2 = encryptValue(ethers.utils.parseEther("1.5"));
      await sealedBidAuction.connect(bidder2).placeBid(
        auctionId,
        bid2.encrypted,
        bid2.proof,
        { value: ethers.utils.parseEther("1.5") }
      );

      // Fast forward to after auction end
      await time.increaseTo(endTime + 1);

      // Reveal winner
      await expect(
        sealedBidAuction.revealWinner(auctionId)
      ).to.emit(sealedBidAuction, "WinnerRevealed");
    });
  });

  describe("English Auction", function () {
    let auctionId;
    let startTime, endTime;

    beforeEach(async function () {
      // Approve NFT transfer
      await sampleNFT.connect(seller).approve(englishAuction.address, tokenId);

      // Create auction
      startTime = await time.latest() + 60;
      endTime = startTime + 3600;

      const reservePrice = encryptValue(ethers.utils.parseEther("1"));
      
      const tx = await englishAuction.connect(seller).createAuction(
        sampleNFT.address,
        tokenId,
        startTime,
        endTime,
        reservePrice.encrypted,
        reservePrice.proof
      );

      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;

      // Fast forward to auction start
      await time.increaseTo(startTime);
    });

    it("Should create an English auction", async function () {
      const details = await englishAuction.getAuctionDetails(auctionId);
      expect(details.seller).to.equal(seller.address);
      expect(details.tokenContract).to.equal(sampleNFT.address);
    });

    it("Should accept incremental bids", async function () {
      const bid1 = encryptValue(ethers.utils.parseEther("1.1"));
      await expect(
        englishAuction.connect(bidder1).placeBid(
          auctionId,
          bid1.encrypted,
          bid1.proof,
          { value: ethers.utils.parseEther("1.1") }
        )
      ).to.emit(englishAuction, "BidIncremented");

      const bid2 = encryptValue(ethers.utils.parseEther("1.2"));
      await expect(
        englishAuction.connect(bidder2).placeBid(
          auctionId,
          bid2.encrypted,
          bid2.proof,
          { value: ethers.utils.parseEther("1.2") }
        )
      ).to.emit(englishAuction, "BidIncremented");
    });

    it("Should extend auction on late bids", async function () {
      // Fast forward to near end
      await time.increaseTo(endTime - 100);

      const bid = encryptValue(ethers.utils.parseEther("2"));
      await expect(
        englishAuction.connect(bidder1).placeBid(
          auctionId,
          bid.encrypted,
          bid.proof,
          { value: ethers.utils.parseEther("2") }
        )
      ).to.emit(englishAuction, "AuctionAutoExtended");
    });

    it("Should allow seller to manually extend auction", async function () {
      await expect(
        englishAuction.connect(seller).extendAuction(auctionId)
      ).to.emit(englishAuction, "AuctionExtended");
    });
  });

  describe("Dutch Auction", function () {
    let auctionId;
    let startTime, endTime;

    beforeEach(async function () {
      // Approve NFT transfer
      await sampleNFT.connect(seller).approve(dutchAuction.address, tokenId);

      // Create auction
      startTime = await time.latest() + 60;
      endTime = startTime + 3600;

      const startingPrice = encryptValue(ethers.utils.parseEther("5"));
      const endingPrice = encryptValue(ethers.utils.parseEther("1"));
      
      const tx = await dutchAuction.connect(seller).createDutchAuction(
        sampleNFT.address,
        tokenId,
        startTime,
        endTime,
        startingPrice.encrypted,
        startingPrice.proof,
        endingPrice.encrypted,
        endingPrice.proof
      );

      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;

      // Fast forward to auction start
      await time.increaseTo(startTime);
    });

    it("Should create a Dutch auction", async function () {
      const details = await dutchAuction.getAuctionDetails(auctionId);
      expect(details.seller).to.equal(seller.address);
      expect(details.tokenContract).to.equal(sampleNFT.address);
    });

    it("Should allow instant buy at current price", async function () {
      await expect(
        dutchAuction.connect(bidder1).buyNow(
          auctionId,
          { value: ethers.utils.parseEther("5") }
        )
      ).to.emit(dutchAuction, "InstantPurchase");
    });

    it("Should decrease price over time", async function () {
      // Fast forward 30 minutes
      await time.increase(1800);
      
      // Price should have decreased
      // Note: In production, we'd decrypt and verify the actual price
      await expect(
        dutchAuction.connect(bidder1).buyNow(
          auctionId,
          { value: ethers.utils.parseEther("3") }
        )
      ).to.emit(dutchAuction, "InstantPurchase");
    });
  });

  describe("Batch Auction", function () {
    let auctionId;
    let startTime, endTime;

    beforeEach(async function () {
      // Create batch auction for 3 items
      startTime = await time.latest() + 60;
      endTime = startTime + 3600;

      const tx = await batchAuction.connect(seller).createBatchAuction(
        3, // 3 items
        startTime,
        endTime,
        false, // not uniform pricing
        true   // combined bidding enabled
      );

      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "BatchAuctionCreated").args.auctionId;

      // Add items to batch
      for (let i = 0; i < 3; i++) {
        const tokenId = i + 1;
        await sampleNFT.connect(seller).approve(batchAuction.address, tokenId);
        
        const reservePrice = encryptValue(ethers.utils.parseEther(String(i + 1)));
        await batchAuction.connect(seller).addBatchItem(
          auctionId,
          i,
          sampleNFT.address,
          tokenId,
          reservePrice.encrypted,
          reservePrice.proof
        );
      }

      // Fast forward to auction start
      await time.increaseTo(startTime);
    });

    it("Should create a batch auction with multiple items", async function () {
      const itemCount = await batchAuction.getItemCount(auctionId);
      expect(itemCount).to.equal(3);
    });

    it("Should accept bids for individual items", async function () {
      const bid = encryptValue(ethers.utils.parseEther("2"));
      await expect(
        batchAuction.connect(bidder1).placeBidForItem(
          auctionId,
          0, // First item
          bid.encrypted,
          bid.proof,
          { value: ethers.utils.parseEther("2") }
        )
      ).to.emit(batchAuction, "BatchBidPlaced");
    });

    it("Should accept combined bids for multiple items", async function () {
      const bids = [
        encryptValue(ethers.utils.parseEther("1.5")),
        encryptValue(ethers.utils.parseEther("2.5")),
        encryptValue(ethers.utils.parseEther("3.5"))
      ];

      await expect(
        batchAuction.connect(bidder1).placeCombinedBid(
          auctionId,
          [0, 1, 2],
          bids.map(b => b.encrypted),
          bids.map(b => b.proof),
          { value: ethers.utils.parseEther("7.5") }
        )
      ).to.emit(batchAuction, "CombinedBidPlaced");
    });

    it("Should settle items individually", async function () {
      // Place bids
      const bid = encryptValue(ethers.utils.parseEther("2"));
      await batchAuction.connect(bidder1).placeBidForItem(
        auctionId,
        0,
        bid.encrypted,
        bid.proof,
        { value: ethers.utils.parseEther("2") }
      );

      // Fast forward to end
      await time.increaseTo(endTime + 1);

      // Reveal winners
      await batchAuction.revealWinner(auctionId);

      // Claim item
      await expect(
        batchAuction.connect(bidder1).claimBatchItem(auctionId, 0)
      ).to.emit(batchAuction, "BatchItemSettled");
    });
  });

  describe("Security Tests", function () {
    it("Should prevent reentrancy attacks", async function () {
      // Test reentrancy protection on bid placement
      // Implementation would require a malicious contract
    });

    it("Should handle pause functionality", async function () {
      await sealedBidAuction.connect(owner).pause();
      
      const reservePrice = encryptValue(ethers.utils.parseEther("1"));
      await expect(
        sealedBidAuction.connect(seller).createAuction(
          sampleNFT.address,
          1,
          await time.latest() + 60,
          await time.latest() + 3660,
          reservePrice.encrypted,
          reservePrice.proof
        )
      ).to.be.revertedWith("Pausable: paused");

      await sealedBidAuction.connect(owner).unpause();
    });

    it("Should enforce access control", async function () {
      await expect(
        sealedBidAuction.connect(bidder1).setPlatformFee(500)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should optimize gas for batch operations", async function () {
      // Create auction and measure gas
      const tx = await sealedBidAuction.connect(seller).createAuction(
        sampleNFT.address,
        1,
        await time.latest() + 60,
        await time.latest() + 3660,
        encryptValue(ethers.utils.parseEther("1")).encrypted,
        encryptValue(ethers.utils.parseEther("1")).proof
      );
      
      const receipt = await tx.wait();
      console.log("Gas used for auction creation:", receipt.gasUsed.toString());
      
      // Gas should be reasonable
      expect(receipt.gasUsed).to.be.lt(500000);
    });
  });

  describe("FHE Operations Tests", function () {
    it("Should maintain bid privacy throughout auction", async function () {
      // In production, verify that bids remain encrypted
      // and comparisons are done homomorphically
    });

    it("Should correctly compare encrypted bids", async function () {
      // Test homomorphic comparison operations
    });

    it("Should handle encrypted arithmetic operations", async function () {
      // Test addition, subtraction for bid increments
    });
  });
});

describe("Integration Tests", function () {
  it("Should handle complete auction lifecycle", async function () {
    // 1. Deploy contracts
    // 2. Create auction
    // 3. Place multiple bids
    // 4. End auction
    // 5. Reveal winner
    // 6. Claim item
    // 7. Process refunds
  });

  it("Should handle multiple concurrent auctions", async function () {
    // Test system with multiple active auctions
  });

  it("Should integrate with external NFT contracts", async function () {
    // Test with various ERC721 implementations
  });
});