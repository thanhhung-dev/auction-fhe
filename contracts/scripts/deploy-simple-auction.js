const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SimpleFHEAuction contract to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  console.log("📦 Deploying SimpleFHEAuction...");

  const SimpleFHEAuction = await hre.ethers.getContractFactory("SimpleFHEAuction");
  const auction = await SimpleFHEAuction.deploy();

  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();

  console.log("\n✅ SimpleFHEAuction deployed to:", auctionAddress);
  console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + auctionAddress + "\n");

  console.log("📋 Add this to your frontend .env.local:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`VITE_AUCTION_CONTRACT_ADDRESS=${auctionAddress}`);
  console.log(`VITE_SEPOLIA_CHAIN_ID=11155111`);
  console.log(`VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("✨ Deployment complete!\n");
  console.log("📝 Contract Features:");
  console.log("  - Create auctions with plaintext starting price");
  console.log("  - Submit encrypted bids using FHE");
  console.log("  - Automatic highest bid tracking");
  console.log("  - End auction after duration\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
