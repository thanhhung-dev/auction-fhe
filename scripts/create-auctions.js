const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Creating test auctions on SimpleFHEAuction contract...\n");

  const contractAddress = "0xbF2A26Bad75721e80332455191D435e194382276";
  const [deployer] = await ethers.getSigners();

  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get contract instance
  const SimpleFHEAuction = await ethers.getContractFactory("SimpleFHEAuction");
  const auction = SimpleFHEAuction.attach(contractAddress);

  // Create 6 test auctions with different parameters
  // Starting prices set to minimal values to save gas
  const testAuctions = [
    {
      name: "CryptoPunk NFT Rights",
      startPrice: ethers.parseEther("0.001"), // minimal starting price
      duration: 30 * 24 * 60 * 60, // 30 days
    },
    {
      name: "Compound Liquidation Asset",
      startPrice: ethers.parseEther("0.001"),
      duration: 30 * 24 * 60 * 60, // 30 days
    },
    {
      name: "Governance Token Package",
      startPrice: ethers.parseEther("0.001"),
      duration: 30 * 24 * 60 * 60, // 30 days
    },
    {
      name: "MakerDAO Vault Debt",
      startPrice: ethers.parseEther("0.001"),
      duration: 30 * 24 * 60 * 60, // 30 days
    },
    {
      name: "Rare NFT Collection Bundle",
      startPrice: ethers.parseEther("0.001"),
      duration: 30 * 24 * 60 * 60, // 30 days
    },
  ];

  for (let i = 0; i < testAuctions.length; i++) {
    const auctionData = testAuctions[i];

    try {
      console.log(`\n[${i + 1}/${testAuctions.length}] Creating auction: ${auctionData.name}`);
      console.log(`  Starting Price: ${ethers.formatEther(auctionData.startPrice)} ETH`);
      console.log(`  Duration: ${auctionData.duration / 3600} hours`);

      const tx = await auction.createAuction(
        auctionData.startPrice,
        auctionData.duration,
        { gasLimit: 500000 }
      );

      console.log(`  Transaction hash: ${tx.hash}`);
      console.log(`  Waiting for confirmation...`);

      const receipt = await tx.wait();
      console.log(`  ✅ Auction created successfully! (Block: ${receipt.blockNumber})`);

      // Small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`  ❌ Failed to create auction: ${error.message}`);
    }
  }

  console.log("\n✅ All auctions created successfully!");
  console.log(`\nView auctions at: https://sepolia.etherscan.io/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
