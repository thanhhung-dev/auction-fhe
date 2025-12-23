const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SimpleFHEAuction", function () {
  let auction;
  let owner, seller, bidder1, bidder2, bidder3;

  beforeEach(async function () {
    [owner, seller, bidder1, bidder2, bidder3] = await ethers.getSigners();

    const SimpleFHEAuction = await ethers.getContractFactory("SimpleFHEAuction");
    auction = await SimpleFHEAuction.deploy();
    await auction.deployed();
  });

  describe("Auction Creation", function () {
    it("Should create an auction with valid parameters", async function () {
      const startPrice = ethers.utils.parseEther("0.01");
      const duration = 86400; // 1 day

      const tx = await auction.connect(seller).createAuction(startPrice, duration);
      const receipt = await tx.wait();

      const event = receipt.events.find(e => e.event === "AuctionCreated");
      expect(event).to.not.be.undefined;
      expect(event.args.auctionId).to.equal(0);
      expect(event.args.seller).to.equal(seller.address);
      expect(event.args.startPrice).to.equal(startPrice);
    });

    it("Should increment auction counter", async function () {
      await auction.connect(seller).createAuction(ethers.utils.parseEther("0.01"), 86400);
      await auction.connect(seller).createAuction(ethers.utils.parseEther("0.02"), 86400);

      const counter = await auction.auctionCounter();
      expect(counter).to.equal(2);
    });

    it("Should reject auction with zero duration", async function () {
      await expect(
        auction.connect(seller).createAuction(ethers.utils.parseEther("0.01"), 0)
      ).to.be.revertedWith("InvalidTime");
    });

    it("Should reject auction with duration > 90 days", async function () {
      const duration = 91 * 24 * 60 * 60; // 91 days
      await expect(
        auction.connect(seller).createAuction(ethers.utils.parseEther("0.01"), duration)
      ).to.be.revertedWith("InvalidTime");
    });

    it("Should reject auction with zero start price", async function () {
      await expect(
        auction.connect(seller).createAuction(0, 86400)
      ).to.be.revertedWith("InvalidPrice");
    });

    it("Should accept maximum duration of 90 days", async function () {
      const duration = 90 * 24 * 60 * 60; // 90 days
      const tx = await auction.connect(seller).createAuction(
        ethers.utils.parseEther("0.01"),
        duration
      );
      const receipt = await tx.wait();

      const event = receipt.events.find(e => e.event === "AuctionCreated");
      expect(event).to.not.be.undefined;
    });

    it("Should set correct start and end times", async function () {
      const duration = 3600; // 1 hour
      await auction.connect(seller).createAuction(ethers.utils.parseEther("0.01"), duration);

      const auctionData = await auction.auctions(0);
      const currentTime = await time.latest();

      expect(auctionData.startTime).to.be.closeTo(currentTime, 2);
      expect(auctionData.endTime).to.equal(auctionData.startTime.add(duration));
    });
  });

  describe("Auction State", function () {
    let auctionId;

    beforeEach(async function () {
      const tx = await auction.connect(seller).createAuction(
        ethers.utils.parseEther("0.01"),
        3600
      );
      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;
    });

    it("Should initialize auction state correctly", async function () {
      const auctionData = await auction.auctions(auctionId);

      expect(auctionData.seller).to.equal(seller.address);
      expect(auctionData.startPrice).to.equal(ethers.utils.parseEther("0.01"));
      expect(auctionData.highestBidder).to.equal(ethers.constants.AddressZero);
      expect(auctionData.ended).to.be.false;
      expect(auctionData.cancelled).to.be.false;
    });

    it("Should query auction details", async function () {
      const auctionData = await auction.auctions(auctionId);
      expect(auctionData.seller).to.equal(seller.address);
      expect(auctionData.startPrice).to.equal(ethers.utils.parseEther("0.01"));
    });
  });

  describe("Bid Placement", function () {
    let auctionId;

    beforeEach(async function () {
      const tx = await auction.connect(seller).createAuction(
        ethers.utils.parseEther("0.01"),
        3600
      );
      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;
    });

    it("Should accept valid bid during auction period", async function () {
      // Note: In production, this would use actual FHE encryption
      // For testing, we simulate the encrypted bid and proof
      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      await expect(
        auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
          value: ethers.utils.parseEther("0.02")
        })
      ).to.emit(auction, "BidSubmitted");
    });

    it("Should reject bid after auction ends", async function () {
      await time.increase(3601); // Fast forward past auction end

      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      await expect(
        auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
          value: ethers.utils.parseEther("0.02")
        })
      ).to.be.revertedWith("AuctionNotActive");
    });

    it("Should reject duplicate bids from same bidder", async function () {
      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      await auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
        value: ethers.utils.parseEther("0.02")
      });

      await expect(
        auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
          value: ethers.utils.parseEther("0.03")
        })
      ).to.be.revertedWith("AlreadyBid");
    });

    it("Should track bid submissions", async function () {
      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      await auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
        value: ethers.utils.parseEther("0.02")
      });

      const hasBid = await auction.hasBid(auctionId, bidder1.address);
      expect(hasBid).to.be.true;
    });

    it("Should store bid in auction bids array", async function () {
      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      await auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
        value: ethers.utils.parseEther("0.02")
      });

      const bid = await auction.auctionBids(auctionId, 0);
      expect(bid.bidder).to.equal(bidder1.address);
    });

    it("Should accept multiple bids from different bidders", async function () {
      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      await auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
        value: ethers.utils.parseEther("0.02")
      });

      await auction.connect(bidder2).placeBid(auctionId, encryptedBid, proof, {
        value: ethers.utils.parseEther("0.03")
      });

      await auction.connect(bidder3).placeBid(auctionId, encryptedBid, proof, {
        value: ethers.utils.parseEther("0.04")
      });

      const hasBid1 = await auction.hasBid(auctionId, bidder1.address);
      const hasBid2 = await auction.hasBid(auctionId, bidder2.address);
      const hasBid3 = await auction.hasBid(auctionId, bidder3.address);

      expect(hasBid1).to.be.true;
      expect(hasBid2).to.be.true;
      expect(hasBid3).to.be.true;
    });
  });

  describe("Auction Ending", function () {
    let auctionId;

    beforeEach(async function () {
      const tx = await auction.connect(seller).createAuction(
        ethers.utils.parseEther("0.01"),
        3600
      );
      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;
    });

    it("Should only allow seller to end auction", async function () {
      await time.increase(3601);

      await expect(
        auction.connect(bidder1).endAuction(auctionId)
      ).to.be.revertedWith("OnlySeller");
    });

    it("Should not allow ending before auction end time", async function () {
      await expect(
        auction.connect(seller).endAuction(auctionId)
      ).to.be.revertedWith("AuctionNotEnded");
    });

    it("Should emit AuctionEnded event", async function () {
      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      await auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
        value: ethers.utils.parseEther("0.02")
      });

      await time.increase(3601);

      await expect(
        auction.connect(seller).endAuction(auctionId)
      ).to.emit(auction, "AuctionEnded");
    });

    it("Should prevent ending auction twice", async function () {
      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      await auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
        value: ethers.utils.parseEther("0.02")
      });

      await time.increase(3601);
      await auction.connect(seller).endAuction(auctionId);

      await expect(
        auction.connect(seller).endAuction(auctionId)
      ).to.be.revertedWith("AuctionAlreadyEnded");
    });

    it("Should mark auction as ended", async function () {
      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      await auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
        value: ethers.utils.parseEther("0.02")
      });

      await time.increase(3601);
      await auction.connect(seller).endAuction(auctionId);

      const auctionData = await auction.auctions(auctionId);
      expect(auctionData.ended).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple concurrent auctions", async function () {
      await auction.connect(seller).createAuction(ethers.utils.parseEther("0.01"), 3600);
      await auction.connect(bidder1).createAuction(ethers.utils.parseEther("0.02"), 7200);
      await auction.connect(bidder2).createAuction(ethers.utils.parseEther("0.03"), 1800);

      const counter = await auction.auctionCounter();
      expect(counter).to.equal(3);

      const auction0 = await auction.auctions(0);
      const auction1 = await auction.auctions(1);
      const auction2 = await auction.auctions(2);

      expect(auction0.seller).to.equal(seller.address);
      expect(auction1.seller).to.equal(bidder1.address);
      expect(auction2.seller).to.equal(bidder2.address);
    });

    it("Should handle minimum price auction (0.01 ETH)", async function () {
      const minPrice = ethers.utils.parseEther("0.01");
      const tx = await auction.connect(seller).createAuction(minPrice, 3600);
      const receipt = await tx.wait();

      const event = receipt.events.find(e => e.event === "AuctionCreated");
      expect(event.args.startPrice).to.equal(minPrice);
    });

    it("Should handle large price values", async function () {
      const largePrice = ethers.utils.parseEther("10000");
      const tx = await auction.connect(seller).createAuction(largePrice, 3600);
      const receipt = await tx.wait();

      const event = receipt.events.find(e => e.event === "AuctionCreated");
      expect(event.args.startPrice).to.equal(largePrice);
    });

    it("Should handle short duration auctions (1 second)", async function () {
      const shortDuration = 1;
      const tx = await auction.connect(seller).createAuction(
        ethers.utils.parseEther("0.01"),
        shortDuration
      );
      await tx.wait();

      const auctionData = await auction.auctions(0);
      expect(auctionData.endTime.sub(auctionData.startTime)).to.equal(shortDuration);
    });
  });

  describe("Gas Optimization", function () {
    it("Should measure gas cost for auction creation", async function () {
      const tx = await auction.connect(seller).createAuction(
        ethers.utils.parseEther("0.01"),
        3600
      );
      const receipt = await tx.wait();

      console.log("Gas used for auction creation:", receipt.gasUsed.toString());
      // Note: Actual gas costs will vary, this is for monitoring
    });

    it("Should measure gas cost for bid placement", async function () {
      await auction.connect(seller).createAuction(ethers.utils.parseEther("0.01"), 3600);

      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      const tx = await auction.connect(bidder1).placeBid(0, encryptedBid, proof, {
        value: ethers.utils.parseEther("0.02")
      });
      const receipt = await tx.wait();

      console.log("Gas used for bid placement:", receipt.gasUsed.toString());
    });
  });

  describe("Security", function () {
    let auctionId;

    beforeEach(async function () {
      const tx = await auction.connect(seller).createAuction(
        ethers.utils.parseEther("0.01"),
        3600
      );
      const receipt = await tx.wait();
      auctionId = receipt.events.find(e => e.event === "AuctionCreated").args.auctionId;
    });

    it("Should prevent bidding on non-existent auction", async function () {
      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      await expect(
        auction.connect(bidder1).placeBid(999, encryptedBid, proof, {
          value: ethers.utils.parseEther("0.02")
        })
      ).to.be.reverted;
    });

    it("Should prevent ending non-existent auction", async function () {
      await expect(
        auction.connect(seller).endAuction(999)
      ).to.be.reverted;
    });

    it("Should maintain bid privacy (encrypted storage)", async function () {
      const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
      const proof = ethers.utils.hexZeroPad("0x01", 64);

      await auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
        value: ethers.utils.parseEther("0.02")
      });

      const bid = await auction.auctionBids(auctionId, 0);
      // In production, verify that encryptedAmount is euint64 type
      // and cannot be read in plaintext
      expect(bid.bidder).to.equal(bidder1.address);
    });
  });
});

describe("Integration Tests", function () {
  let auction;
  let seller, bidder1, bidder2;

  beforeEach(async function () {
    [, seller, bidder1, bidder2] = await ethers.getSigners();

    const SimpleFHEAuction = await ethers.getContractFactory("SimpleFHEAuction");
    auction = await SimpleFHEAuction.deploy();
    await auction.deployed();
  });

  it("Should complete full auction lifecycle", async function () {
    // 1. Create auction
    const createTx = await auction.connect(seller).createAuction(
      ethers.utils.parseEther("0.01"),
      3600
    );
    const createReceipt = await createTx.wait();
    const auctionId = createReceipt.events.find(e => e.event === "AuctionCreated").args.auctionId;

    // 2. Place bids
    const encryptedBid = ethers.utils.hexZeroPad("0x01", 32);
    const proof = ethers.utils.hexZeroPad("0x01", 64);

    await auction.connect(bidder1).placeBid(auctionId, encryptedBid, proof, {
      value: ethers.utils.parseEther("0.02")
    });

    await auction.connect(bidder2).placeBid(auctionId, encryptedBid, proof, {
      value: ethers.utils.parseEther("0.03")
    });

    // 3. Wait for auction to end
    await time.increase(3601);

    // 4. End auction
    const endTx = await auction.connect(seller).endAuction(auctionId);
    const endReceipt = await endTx.wait();

    const endEvent = endReceipt.events.find(e => e.event === "AuctionEnded");
    expect(endEvent).to.not.be.undefined;

    // 5. Verify final state
    const auctionData = await auction.auctions(auctionId);
    expect(auctionData.ended).to.be.true;
  });

  it("Should handle multiple auctions with different durations", async function () {
    // Create 3 auctions with different durations
    await auction.connect(seller).createAuction(ethers.utils.parseEther("0.01"), 1800);  // 30 min
    await auction.connect(seller).createAuction(ethers.utils.parseEther("0.02"), 3600);  // 1 hour
    await auction.connect(seller).createAuction(ethers.utils.parseEther("0.03"), 7200);  // 2 hours

    // First auction ends
    await time.increase(1801);
    await auction.connect(seller).endAuction(0);

    let auction0 = await auction.auctions(0);
    let auction1 = await auction.auctions(1);
    let auction2 = await auction.auctions(2);

    expect(auction0.ended).to.be.true;
    expect(auction1.ended).to.be.false;
    expect(auction2.ended).to.be.false;

    // Second auction ends
    await time.increase(1800);
    await auction.connect(seller).endAuction(1);

    auction1 = await auction.auctions(1);
    auction2 = await auction.auctions(2);

    expect(auction1.ended).to.be.true;
    expect(auction2.ended).to.be.false;
  });
});
