const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("SimpleFHEAuction - Basic Functionality Tests", function () {
  let contract;
  let owner, seller, bidder1, bidder2, bidder3;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, seller, bidder1, bidder2, bidder3] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("SimpleFHEAuction");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;
  });

  it("should deploy contract successfully", async function () {
    expect(await contract.getAddress()).to.be.properAddress;
    console.log("✅ Contract deployed at:", await contract.getAddress());
  });

  it("should have correct initial state", async function () {
    const totalAuctions = await contract.getTotalAuctions();
    expect(totalAuctions).to.equal(0);
    console.log("✅ Initial auction count is 0");
  });

  it("should create a new auction", async function () {
    const startPrice = ethers.parseEther("0.1");
    const duration = 3600; // 1 hour

    const tx = await contract.connect(seller).createAuction(startPrice, duration);
    const receipt = await tx.wait();

    // Check event emission
    const auctionCreatedEvent = receipt.logs.find((log) => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === "AuctionCreated";
      } catch {
        return false;
      }
    });

    expect(auctionCreatedEvent).to.not.be.undefined;
    const auctionId = auctionCreatedEvent.args.auctionId;
    expect(auctionId).to.equal(0);

    const totalAuctions = await contract.getTotalAuctions();
    expect(totalAuctions).to.equal(1);

    console.log("✅ Auction created successfully with ID:", auctionId.toString());
  });

  it("should create multiple auctions with sequential IDs", async function () {
    const startPrice = ethers.parseEther("0.1");
    const duration = 3600;

    // Create 3 auctions
    for (let i = 0; i < 3; i++) {
      const tx = await contract.connect(seller).createAuction(startPrice, duration);
      await tx.wait();
    }

    const totalAuctions = await contract.getTotalAuctions();
    expect(totalAuctions).to.equal(3);

    console.log("✅ Created 3 auctions with sequential IDs");
  });

  it("should return correct auction details", async function () {
    const startPrice = ethers.parseEther("0.5");
    const duration = 7200; // 2 hours

    await contract.connect(seller).createAuction(startPrice, duration);

    const auction = await contract.getAuction(0);

    expect(auction.seller).to.equal(seller.address);
    expect(auction.startPrice).to.equal(startPrice);
    expect(auction.ended).to.equal(false);
    expect(auction.settled).to.equal(false);
    expect(auction.cancelled).to.equal(false);
    expect(auction.bidCount).to.equal(0);

    console.log("✅ Auction details retrieved correctly");
  });

  it("should reject invalid auction parameters - zero price", async function () {
    await expect(
      contract.connect(seller).createAuction(0, 3600)
    ).to.be.revertedWithCustomError(contract, "InvalidPrice");

    console.log("✅ Zero price correctly rejected");
  });

  it("should reject invalid auction parameters - zero duration", async function () {
    await expect(
      contract.connect(seller).createAuction(ethers.parseEther("0.1"), 0)
    ).to.be.revertedWithCustomError(contract, "InvalidTime");

    console.log("✅ Zero duration correctly rejected");
  });

  it("should reject invalid auction parameters - excessive duration", async function () {
    const ninetyOneDays = 91 * 24 * 60 * 60;
    await expect(
      contract.connect(seller).createAuction(ethers.parseEther("0.1"), ninetyOneDays)
    ).to.be.revertedWithCustomError(contract, "InvalidTime");

    console.log("✅ Excessive duration (>90 days) correctly rejected");
  });

  it("should allow seller to cancel auction before any bids", async function () {
    const startPrice = ethers.parseEther("0.1");
    const duration = 3600;

    await contract.connect(seller).createAuction(startPrice, duration);

    const tx = await contract.connect(seller).cancelAuction(0);
    const receipt = await tx.wait();

    // Check event emission
    const cancelledEvent = receipt.logs.find((log) => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === "AuctionCancelled";
      } catch {
        return false;
      }
    });

    expect(cancelledEvent).to.not.be.undefined;

    const auction = await contract.getAuction(0);
    expect(auction.cancelled).to.equal(true);

    console.log("✅ Auction cancelled successfully");
  });

  it("should reject cancel from non-seller", async function () {
    const startPrice = ethers.parseEther("0.1");
    const duration = 3600;

    await contract.connect(seller).createAuction(startPrice, duration);

    await expect(
      contract.connect(bidder1).cancelAuction(0)
    ).to.be.revertedWithCustomError(contract, "OnlySeller");

    console.log("✅ Non-seller cancel correctly rejected");
  });

  it("should track user bids correctly", async function () {
    const startPrice = ethers.parseEther("0.1");
    const duration = 3600;

    await contract.connect(seller).createAuction(startPrice, duration);

    // Before bidding
    expect(await contract.hasUserBid(0, bidder1.address)).to.equal(false);

    // Submit encrypted bid
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(BigInt(500000000)) // 0.5 Gwei
      .encrypt();

    await contract.connect(bidder1).submitBid(0, encrypted.handles[0], encrypted.inputProof);

    // After bidding
    expect(await contract.hasUserBid(0, bidder1.address)).to.equal(true);
    expect(await contract.hasUserBid(0, bidder2.address)).to.equal(false);

    console.log("✅ User bid tracking works correctly");
  });

  it("should emit correct events during auction lifecycle", async function () {
    const startPrice = ethers.parseEther("0.1");
    const duration = 300; // 5 minutes

    // 1. Create auction
    const createTx = await contract.connect(seller).createAuction(startPrice, duration);
    const createReceipt = await createTx.wait();

    const createdEvent = createReceipt.logs.find((log) => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === "AuctionCreated";
      } catch {
        return false;
      }
    });

    expect(createdEvent).to.not.be.undefined;
    expect(createdEvent.args.seller).to.equal(seller.address);
    expect(createdEvent.args.startPrice).to.equal(startPrice);

    console.log("✅ AuctionCreated event emitted correctly");

    // 2. Submit bid
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(BigInt(500000000))
      .encrypt();

    const bidTx = await contract.connect(bidder1).submitBid(0, encrypted.handles[0], encrypted.inputProof);
    const bidReceipt = await bidTx.wait();

    const bidEvent = bidReceipt.logs.find((log) => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === "BidSubmitted";
      } catch {
        return false;
      }
    });

    expect(bidEvent).to.not.be.undefined;
    expect(bidEvent.args.bidder).to.equal(bidder1.address);

    console.log("✅ BidSubmitted event emitted correctly");

    // 3. End auction (advance time first)
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);

    const endTx = await contract.connect(seller).endAuction(0);
    const endReceipt = await endTx.wait();

    const endedEvent = endReceipt.logs.find((log) => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === "AuctionEnded";
      } catch {
        return false;
      }
    });

    expect(endedEvent).to.not.be.undefined;

    console.log("✅ AuctionEnded event emitted correctly");
    console.log("✅ All auction lifecycle events verified");
  });

  it("should handle edge case: create auction at maximum duration", async function () {
    const startPrice = ethers.parseEther("0.1");
    const maxDuration = 90 * 24 * 60 * 60; // 90 days

    const tx = await contract.connect(seller).createAuction(startPrice, maxDuration);
    await tx.wait();

    const auction = await contract.getAuction(0);
    expect(auction.seller).to.equal(seller.address);

    console.log("✅ Auction with maximum duration created successfully");
  });

  it("should handle performance: create multiple auctions rapidly", async function () {
    const startTime = Date.now();

    const startPrice = ethers.parseEther("0.1");
    const duration = 3600;

    // Create 10 auctions rapidly
    for (let i = 0; i < 10; i++) {
      await contract.connect(seller).createAuction(startPrice, duration);
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    const totalAuctions = await contract.getTotalAuctions();
    expect(totalAuctions).to.equal(10);
    expect(executionTime).to.be.lessThan(10000); // Should complete in under 10 seconds

    console.log(`✅ Created 10 auctions in ${executionTime}ms`);
  });
});
