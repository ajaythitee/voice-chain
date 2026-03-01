const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying TenderVoting contract to Polygon Amoy...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "POL");

    // Deploy TenderVoting contract
    const TenderVoting = await hre.ethers.getContractFactory("TenderVoting");
    const tenderVoting = await TenderVoting.deploy();

    await tenderVoting.waitForDeployment();

    const contractAddress = await tenderVoting.getAddress();
    console.log("✅ TenderVoting deployed to:", contractAddress);

    // Save contract address and ABI to frontend config
    const contractConfig = {
        address: contractAddress,
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        deployedAt: new Date().toISOString(),
    };

    // Save to src directory
    const configPath = path.join(__dirname, "..", "src", "contractConfig.json");
    fs.writeFileSync(configPath, JSON.stringify(contractConfig, null, 2));
    console.log("📄 Contract config saved to:", configPath);

    // Save ABI
    const artifactPath = path.join(
        __dirname,
        "..",
        "artifacts",
        "contracts",
        "TenderVoting.sol",
        "TenderVoting.json"
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiPath = path.join(__dirname, "..", "src", "TenderVotingABI.json");
    fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
    console.log("📄 ABI saved to:", abiPath);

    console.log("\n⏳ Waiting for block confirmations...");
    await tenderVoting.deploymentTransaction().wait(5);

    // Verify contract on PolygonScan
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
        console.log("\n🔍 Verifying contract on PolygonScan...");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [],
            });
            console.log("✅ Contract verified successfully!");
        } catch (error) {
            console.log("❌ Verification failed:", error.message);
        }
    }

    console.log("\n🎉 Deployment complete!");
    console.log("📋 Contract Address:", contractAddress);
    console.log("🔗 View on PolygonScan:", `https://amoy.polygonscan.com/address/${contractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
