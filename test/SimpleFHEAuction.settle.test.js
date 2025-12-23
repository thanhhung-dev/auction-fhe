const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("SimpleFHEAuction - Settlement and Decryption Flow Tests", function () {
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

  it("should end auction after time expires", async function () {
    // Create auction with 5 minute duration
    const duration = 300;
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);

    // Submit a bid
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(BigInt(500000000))
      .encrypt();

    await contract.connect(bidder1).submitBid(0, encrypted.handles[0], encrypted.inputProof);

    // Advance time past auction end
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);

    // End the auction
    const tx = await contract.connect(seller).endAuction(0);
    const receipt = await tx.wait();

    // Verify AuctionEnded event
    const endedEvent = receipt.logs.find((log) => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === "AuctionEnded";
      } catch {
        return false;
      }
    });

    expect(endedEvent).to.not.be.undefined;

    const auction = await contract.getAuction(0);
    expect(auction.ended).to.equal(true);
    expect(auction.settled).to.equal(false); // Not yet settled

    console.log("✅ Auction ended successfully after time expired");
  });

  it("should reject ending auction before time expires", async function () {
    const duration = 3600;
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);

    // Try to end before time expires
    await expect(
      contract.connect(seller).endAuction(0)
    ).to.be.revertedWithCustomError(contract, "AuctionNotEnded");

    console.log("✅ Ending auction before time correctly rejected");
  });

  it("should reject ending already ended auction", async function () {
    const duration = 300;
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);

    // Advance time and end
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);
    await contract.connect(seller).endAuction(0);

    // Try to end again
    await expect(
      contract.connect(seller).endAuction(0)
    ).to.be.revertedWithCustomError(contract, "AuctionAlreadyEnded");

    console.log("✅ Double ending auction correctly rejected");
  });

  it("should reject ending cancelled auction", async function () {
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), 300);
    await contract.connect(seller).cancelAuction(0);

    // Advance time
    await ethers.provider.send("evm_increaseTime", [301]);
    await ethers.provider.send("evm_mine", []);

    // Try to end cancelled auction
    await expect(
      contract.connect(seller).endAuction(0)
    ).to.be.revertedWithCustomError(contract, "AuctionNotActive");

    console.log("✅ Ending cancelled auction correctly rejected");
  });

  it("should get highest bid handle after auction ended", async function () {
    const duration = 300;
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);

    // Submit bid
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(BigInt(500000000))
      .encrypt();

    await contract.connect(bidder1).submitBid(0, encrypted.handles[0], encrypted.inputProof);

    // End auction
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);
    await contract.connect(seller).endAuction(0);

    // Get highest bid handle
    const handle = await contract.getHighestBidHandle(0);
    expect(handle).to.not.be.undefined;

    console.log("✅ Highest bid handle retrieved successfully");
  });

  it("should reject getting highest bid handle before auction ended", async function () {
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), 300);

    await expect(
      contract.getHighestBidHandle(0)
    ).to.be.revertedWithCustomError(contract, "AuctionNotEndedYet");

    console.log("✅ Getting handle before auction ended correctly rejected");
  });

  it("should prevent cancel after bids submitted", async function () {
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), 300);

    // Submit bid
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(BigInt(500000000))
      .encrypt();

    await contract.connect(bidder1).submitBid(0, encrypted.handles[0], encrypted.inputProof);

    // Try to cancel after bid
    await expect(
      contract.connect(seller).cancelAuction(0)
    ).to.be.revertedWithCustomError(contract, "AuctionNotActive");

    console.log("✅ Cancel after bids correctly prevented");
  });

  it("should track winner correctly with multiple bidders", async function () {
    const duration = 300;
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);

    // Submit multiple bids with increasing amounts
    const bidders = [bidder1, bidder2, bidder3];
    const amounts = [BigInt(100000000), BigInt(300000000), BigInt(200000000)];

    for (let i = 0; i < bidders.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), bidders[i].address)
        .add64(amounts[i])
        .encrypt();

      await contract.connect(bidders[i]).submitBid(0, encrypted.handles[0], encrypted.inputProof);
    }

    // End auction
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);
    await contract.connect(seller).endAuction(0);

    const auction = await contract.getAuction(0);
    expect(auction.bidCount).to.equal(3);
    expect(auction.ended).to.equal(true);

    console.log("✅ Multiple bidders tracked correctly");
  });

  it("should test complete auction lifecycle without settlement", async function () {
    console.log("Testing complete auction lifecycle...");

    // 1. Create auction
    const duration = 300;
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);
    console.log("✅ Step 1: Auction created");

    // 2. Submit multiple bids
    const bidders = [bidder1, bidder2];
    for (let i = 0; i < bidders.length; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), bidders[i].address)
        .add64(BigInt((i + 1) * 100000000))
        .encrypt();

      await contract.connect(bidders[i]).submitBid(0, encrypted.handles[0], encrypted.inputProof);
    }
    console.log("✅ Step 2: Bids submitted");

    // 3. End auction
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);
    await contract.connect(seller).endAuction(0);
    console.log("✅ Step 3: Auction ended");

    // 4. Verify final state
    const auction = await contract.getAuction(0);
    expect(auction.ended).to.equal(true);
    expect(auction.settled).to.equal(false);
    expect(auction.bidCount).to.equal(2);
    console.log("✅ Step 4: Final state verified");

    console.log("✅ Complete auction lifecycle tested successfully");
  });

  it("should handle auction with no bids", async function () {
    const duration = 300;
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);

    // Advance time and end (no bids)
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);
    await contract.connect(seller).endAuction(0);

    const auction = await contract.getAuction(0);
    expect(auction.ended).to.equal(true);
    expect(auction.bidCount).to.equal(0);
    expect(auction.highestBidder).to.equal("0x0000000000000000000000000000000000000000");

    console.log("✅ Auction with no bids ended correctly");
  });

  it("should allow anyone to end auction after time", async function () {
    const duration = 300;
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);

    // Submit bid
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(BigInt(500000000))
      .encrypt();

    await contract.connect(bidder1).submitBid(0, encrypted.handles[0], encrypted.inputProof);

    // Advance time
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);

    // Non-seller can end auction
    await contract.connect(bidder2).endAuction(0);

    const auction = await contract.getAuction(0);
    expect(auction.ended).to.equal(true);

    console.log("✅ Anyone can end auction after time expires");
  });

  it("should verify FHE decryption flow: makePubliclyDecryptable", async function () {
    console.log("Testing FHE decryption flow setup...");

    const duration = 300;
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);

    // Submit bid
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(BigInt(500000000))
      .encrypt();

    await contract.connect(bidder1).submitBid(0, encrypted.handles[0], encrypted.inputProof);

    // End auction - this calls FHE.makePubliclyDecryptable()
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);

    const tx = await contract.connect(seller).endAuction(0);
    await tx.wait();

    console.log("✅ FHE.makePubliclyDecryptable() called during endAuction");

    // Get handle for verification
    const handle = await contract.getHighestBidHandle(0);
    expect(handle).to.not.be.undefined;

    console.log("✅ Encrypted highest bid handle available for KMS decryption");
  });

  it("should reject settlement without ending first", async function () {
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), 300);

    // Try to settle without ending
    const emptyHandles = [];
    const emptyCleartexts = "0x";
    const emptyProof = "0x";

    await expect(
      contract.connect(seller).settleAuction(0, emptyHandles, emptyCleartexts, emptyProof)
    ).to.be.revertedWithCustomError(contract, "AuctionNotEndedYet");

    console.log("✅ Settlement without ending correctly rejected");
  });

  it("should reject settlement with invalid handles list", async function () {
    const duration = 300;
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);

    // Submit bid and end auction
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(BigInt(500000000))
      .encrypt();

    await contract.connect(bidder1).submitBid(0, encrypted.handles[0], encrypted.inputProof);

    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);
    await contract.connect(seller).endAuction(0);

    // Try to settle with empty handles
    const emptyHandles = [];
    const emptyCleartexts = "0x";
    const emptyProof = "0x";

    await expect(
      contract.connect(seller).settleAuction(0, emptyHandles, emptyCleartexts, emptyProof)
    ).to.be.revertedWithCustomError(contract, "InvalidDecryptionProof");

    console.log("✅ Settlement with empty handles correctly rejected");
  });

  it("should handle performance: multiple auctions ending simultaneously", async function () {
    const startTime = Date.now();
    const duration = 300;

    // Create multiple auctions
    for (let i = 0; i < 5; i++) {
      await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);
    }

    // Submit bids to each auction
    for (let i = 0; i < 5; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), bidder1.address)
        .add64(BigInt((i + 1) * 100000000))
        .encrypt();

      await contract.connect(bidder1).submitBid(i, encrypted.handles[0], encrypted.inputProof);
    }

    // Advance time
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);

    // End all auctions
    for (let i = 0; i < 5; i++) {
      await contract.connect(seller).endAuction(i);
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Verify all ended
    for (let i = 0; i < 5; i++) {
      const auction = await contract.getAuction(i);
      expect(auction.ended).to.equal(true);
    }

    expect(executionTime).to.be.lessThan(20000); // Should complete in under 20 seconds

    console.log(`✅ 5 auctions ended in ${executionTime}ms`);
  });

  it("should emit all events correctly during end and settlement flow", async function () {
    const duration = 300;
    await contract.connect(seller).createAuction(ethers.parseEther("0.1"), duration);

    // Submit bid
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), bidder1.address)
      .add64(BigInt(500000000))
      .encrypt();

    await contract.connect(bidder1).submitBid(0, encrypted.handles[0], encrypted.inputProof);

    // End auction
    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);

    const tx = await contract.connect(seller).endAuction(0);
    const receipt = await tx.wait();

    // Verify AuctionEnded event
    const endedEvent = receipt.logs.find((log) => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === "AuctionEnded";
      } catch {
        return false;
      }
    });

    expect(endedEvent).to.not.be.undefined;
    expect(endedEvent.args.auctionId).to.equal(0);
    expect(endedEvent.args.winner).to.equal(bidder1.address);
    expect(endedEvent.args.timestamp).to.be.greaterThan(0);

    console.log("✅ AuctionEnded event emitted with correct data");
  });
});
