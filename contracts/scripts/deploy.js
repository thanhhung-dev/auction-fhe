const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting FHE Sealed Bid Auction deployment to Sepolia...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance < hre.ethers.parseEther("0.1")) {
    console.warn("⚠️  Warning: Low balance. You may need more ETH for deployment.\n");
  }

  // Deploy FHESealedBidAuction
  console.log("📦 Deploying FHESealedBidAuction contract...");
  
  const FHESealedBidAuction = await hre.ethers.getContractFactory("FHESealedBidAuction");
  const auction = await FHESealedBidAuction.deploy();
  
  await auction.waitForDeployment();
  const auctionAddress = await auction.getAddress();

  console.log("✅ FHESealedBidAuction deployed to:", auctionAddress);
  console.log("🔗 View on Etherscan: https://sepolia.etherscan.io/address/" + auctionAddress + "\n");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      FHESealedBidAuction: {
        address: auctionAddress,
        transactionHash: auction.deploymentTransaction()?.hash,
        blockNumber: (await auction.deploymentTransaction()?.wait())?.blockNumber,
      }
    }
  };

  // Save to deployments folder
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentPath);

  // Save ABI for frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/FHESealedBidAuction_FIXED.sol/FHESealedBidAuction.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiPath = path.join(deploymentsDir, `FHESealedBidAuction-abi.json`);
    fs.writeFileSync(abiPath, JSON.stringify({ abi: artifact.abi }, null, 2));
    console.log("💾 ABI saved to:", abiPath);
  }

  // Print environment variables for frontend
  console.log("\n📋 Add these to your frontend .env file:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`VITE_AUCTION_CONTRACT_ADDRESS=${auctionAddress}`);
  console.log(`VITE_SEPOLIA_CHAIN_ID=11155111`);
  console.log(`VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Verify contract if Etherscan API key is available
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("⏳ Waiting 30 seconds before verifying contract...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      console.log("🔍 Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: auctionAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("You can verify manually later using:");
      console.log(`npx hardhat verify --network sepolia ${auctionAddress}`);
    }
  } else {
    console.log("ℹ️  Skipping verification (no ETHERSCAN_API_KEY found)");
    console.log("To verify later, add ETHERSCAN_API_KEY to .env and run:");
    console.log(`npx hardhat verify --network sepolia ${auctionAddress}`);
  }

  console.log("\n✨ Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
