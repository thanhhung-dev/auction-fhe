const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying FHESealedAuction contract to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Auction parameters
  const startAt = Math.floor(Date.now() / 1000) + 300; // Start in 5 minutes
  const endAt = startAt + 86400; // End in 24 hours

  // Reserve price: 0.1 ETH (as dummy encrypted value)
  const reserveExt = "0x0000000000000000000000000000000000000000000000000000000000000001";
  const reserveProof = "0x00";

  console.log("📦 Deploying FHESealedAuction with parameters:");
  console.log("  - Start time:", new Date(startAt * 1000).toLocaleString());
  console.log("  - End time:", new Date(endAt * 1000).toLocaleString());

  const FHESealedAuction = await hre.ethers.getContractFactory("FHESealedAuction");
  const auction = await FHESealedAuction.deploy(
    startAt,
    endAt,
    reserveExt,
    reserveProof
  );

  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();

  console.log("\n✅ FHESealedAuction deployed to:", auctionAddress);
  console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + auctionAddress + "\n");

  console.log("📋 Add this to your frontend .env:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`VITE_AUCTION_CONTRACT_ADDRESS=${auctionAddress}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("✨ Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
