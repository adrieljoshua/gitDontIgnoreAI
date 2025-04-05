import { ethers } from "hardhat";
import { hashEndpointWithScope } from "@selfxyz/core";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const nonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("Account nonce:", nonce);
  
  const futureAddress = ethers.getCreateAddress({
    from: deployer.address,
    nonce: nonce
  });
  console.log("Calculated future contract address:", futureAddress);
  
  // Choose the correct verification hub for your environment:
  
  // For production environment (real passports)
  // const identityVerificationHub = "0x9AcA2112D34Ef021084264F6f5eef2a99a5bA7b1";
  
  // For staging environment (mock passports)
  const identityVerificationHub = "0x3e2487a250e2A7b56c7ef5307Fb591Cc8C83623D";
  
  // IMPORTANT: Use a stable endpoint URL that won't change
  // This is crucial because the scope hash is derived from this URL
  // DO NOT use ngrok URLs in production as they are temporary
  const endpointUrl = "https://7d78-111-235-226-130.ngrok-free.app";
  const scopeName = "git-ignore"; 
  
  // Calculate the scope hash - this MUST match the one in your frontend
  const scope = hashEndpointWithScope(endpointUrl, scopeName);
  console.log("Calculated scope hash:", scope.toString());
  console.log("Endpoint URL used:", endpointUrl);
  console.log("Scope name used:", scopeName);
  
  // Print verification instructions for frontend
  console.log("\nFrontend verification code:");
  console.log(`const endpointUrl = "${endpointUrl}";`);
  console.log(`const scopeName = "${scopeName}";`);
  console.log(`const scopeValue = hashEndpointWithScope(endpointUrl, scopeName);`);
  console.log("// Expected scope value:", scope.toString());
  
  // Attestation ID - usually 1 for basic passport verification
  const attestationId = 1n;

  // Additional verification parameters
  const olderThanEnabled = false;
  const olderThan = 18n;
  const forbiddenCountriesEnabled = false;
  const forbiddenCountriesListPacked = [0n, 0n, 0n, 0n] as [bigint, bigint, bigint, bigint];
  const ofacEnabled = [false, false, false] as [boolean, boolean, boolean];
  
  // Get contract factory for the GitIgnore contract
  const GitIgnore = await ethers.getContractFactory("GitIgnore");

  console.log("\nDeploying GitIgnore contract...");
  const gitIgnore = await GitIgnore.deploy(
    identityVerificationHub,
    scope,
    attestationId,
    olderThanEnabled,
    olderThan,
    forbiddenCountriesEnabled,
    forbiddenCountriesListPacked,
    ofacEnabled
  );
  
  await gitIgnore.waitForDeployment();
  
  const deployedAddress = await gitIgnore.getAddress();
  console.log("GitIgnore deployed to:", deployedAddress);
  
  console.log("\nVerify contract on Celoscan:");
  console.log(`npx hardhat verify --network ${process.env.HARDHAT_NETWORK || "alfajores"} ${deployedAddress} ${identityVerificationHub} ${scope} ${attestationId}  ${olderThanEnabled} ${olderThan} ${forbiddenCountriesEnabled} "[${forbiddenCountriesListPacked.join(',')}]" "[${ofacEnabled.join(',')}]"`);
  
  console.log("\nUpdate your frontend with:");
  console.log(`const contractAddress = "${deployedAddress}";`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 