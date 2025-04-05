import { NextApiRequest, NextApiResponse } from 'next';
import { 
    getUserIdentifier, 
    SelfBackendVerifier,
    hashEndpointWithScope
} from '@selfxyz/core';
import { ethers, Log } from 'ethers';
import { abi } from '../../content/abi';
import { NextRequest, NextResponse } from 'next/server';


// Function to get GitHub username from an address
async function getGithubUsername(address: string): Promise<string> {
    // In a real implementation, you would query a database or service
    // For this demo, we're creating a deterministic username from the address
    console.log(`Getting GitHub username for address: ${address}`);
    return `github-user-${address.substring(0, 6)}`;
}

// Function to analyze GitHub account by calling our githubAnalyser API
async function analyzeGithubAccount(githubUsername: string): Promise<number> {
    try {
        console.log(`Calling GitHub analyzer for: ${githubUsername}`);
        
        // Make API call to our githubAnalyser endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/githubAnalyser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ githubUsername }),
        });
        
        if (!response.ok) {
            throw new Error(`GitHub analysis failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`GitHub analysis result:`, data);
        
        return data.success ? data.result.score : 0;
    } catch (error) {
        console.error('Error analyzing GitHub account:', error);
        // Return default score if analysis fails
        return 67;
    }
}

// Function to check if the user is a client
async function isClientUser(address: string): Promise<boolean> {
    // This would typically check against a database or another service
    // For demo purposes, we're using a simple check based on the address
    console.log(`Checking if ${address} is a client`);
    
    // Example: Consider addresses starting with 0x1 as clients
    return address.toLowerCase().startsWith('0x1');
}



export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}

export async function POST(req: NextRequest) {
try {
    // Parse the request body
    const body = await req.json();
    const { proof, publicSignals } = body;

    if (!proof || !publicSignals) {
        return NextResponse.json({ message: 'Proof and publicSignals are required' }, { status: 400 });
    }
    
    // Get URL parameters
    const url = new URL(req.url);
    const isClientParam = url.searchParams.get('isClient');
    const githubUsernameParam = url.searchParams.get('githubUsername');
    
    // Get isClient and githubUsername from either query parameters or body
    let isClient: boolean;
    const isClientBody = body.isClient === true;
    
    if (isClientParam !== null) {
        isClient = isClientParam.toLowerCase() === 'true';
    } else if (isClientBody !== undefined) {
        isClient = isClientBody;
    } else {
        // Will be determined later from the address
        isClient = false;
    }
    
    const githubUsernameBody = (body.githubUsername || '') as string;
    const githubUsernameInput = githubUsernameParam || githubUsernameBody;
    
    // Calculate the scope value - should match the one in your contract deployment
    const endpointUrl = process.env.SELF_ENDPOINT || 'http://localhost:3000';
    const scopeName = "GitIgnore"; 
    
    // Calculate the hash of the scope that's used in the contract
    const scopeHash = hashEndpointWithScope(endpointUrl, scopeName);
    console.log("Calculated scope hash:", scopeHash);
    
    // Contract address - UPDATED to newly deployed GitIgnore contract
    const contractAddress = process.env.SELF_CONTRACT_ADDRESS || '0xYourContractAddressHere';

    // IMPORTANT FIX: Extract the actual Ethereum address from publicSignals
    const userAddress = await getUserIdentifier(publicSignals, "hex");
    console.log("User address:", userAddress);

    // Determine isClient if not provided via params/body
    if (isClientParam === null && isClientBody === undefined) {
        isClient = await isClientUser(userAddress);
    }
    console.log("Is client:", isClient);

    // Get GitHub username
    const githubUsername = githubUsernameInput || await getGithubUsername(userAddress);
    console.log("GitHub username:", githubUsername);
    
    let score = 0;
    if (!isClient) {
        score = await analyzeGithubAccount(githubUsername);
        console.log("GitHub score:", score);
    } else {
        console.log("Client user - skipping GitHub score analysis");
        // Set default score for clients
        score = 100;
    }
    
    // Connect to Celo network - using Alfajores testnet
    const provider = new ethers.JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
    
    // Use environment variable for private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("PRIVATE_KEY environment variable is not set");
    }
    const signer = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
        console.log("Starting two-step verification process");
        
        // Step 1: Verify Self proof
        console.log("Step 1: Verifying Self proof");
        console.log("Proof:", proof);
        console.log("Public signals:", publicSignals);
        
        const tx1 = await contract.verifySelfProof(
            {
                a: proof.a,
                b: [
                    [proof.b[0][1], proof.b[0][0]],
                    [proof.b[1][1], proof.b[1][0]]
                ],
                c: proof.c,
                pubSignals: publicSignals,
            }
        );
        console.log("Step 1 transaction sent:", tx1.hash);
        const receipt1 = await tx1.wait();
        console.log("Step 1 transaction receipt:", receipt1);
        
        if (receipt1.status !== 1) {
            throw new Error("Self verification failed in step 1");
        }
        
        // Check if the user was registered successfully
        const isRegistered = await contract.isUserRegistered(userAddress);
        console.log("User registration status:", isRegistered);
        
        if (!isRegistered) {
            throw new Error("User not registered properly in step 1");
        }
        
        // Step 2: Complete verification with score and client status
        console.log("Step 2: Completing verification with parameters:", {
            score,
            isClient
        });
        
        // Call the contract function that allows the server to complete verification
        const tx2 = await contract.completeVerificationFor(
            userAddress,  // The user's address we're verifying for
            score,
            isClient
        );
        
        console.log("Step 2 transaction sent:", tx2.hash);
        const receipt2 = await tx2.wait();
        console.log("Step 2 transaction receipt:", receipt2);
        
        // Process the events from both transactions
        let events: (ethers.LogDescription | null)[] = [];
        if (receipt1.logs) {
            const events1 = receipt1.logs
                .map((log: Log) => {
                    try {
                        return contract.interface.parseLog(log as any);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(Boolean);
            events = [...events, ...events1];
        }
        
        if (receipt2.logs) {
            const events2 = receipt2.logs
                .map((log: Log) => {
                    try {
                        return contract.interface.parseLog(log as any);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(Boolean);
            events = [...events, ...events2];
        }
        
        console.log("Parsed events:", events);
        
        // Check if step 2 transaction was successful
        if (receipt2.status === 1) {
            console.log("Two-step verification succeeded");
            
            // Try to get the user verification status
            try {
                const verificationStatus = await contract.getUserVerificationStatus(userAddress);
                console.log("User verification status:", verificationStatus);
                
                return NextResponse.json({
                    status: 'success',
                    result: true,
                    message: 'Successfully verified your GitHub account',
                    details: {
                        githubUsername: verificationStatus.githubUsername || githubUsername,
                        score: Number(verificationStatus.score),
                        address: userAddress,
                        verified: verificationStatus.verified,
                        isClient: verificationStatus.isClient || isClient,
                        txHash: tx2.hash,
                        step1TxHash: tx1.hash,
                        blockNumber: receipt2.blockNumber
                    }
                });
            } catch (statusError) {
                console.error("Error getting verification status:", statusError);
                // Still return success since the transaction went through
                return NextResponse.json({
                    status: 'success',
                    result: true,
                    message: 'Verification successful but could not retrieve status',
                    details: {
                        githubUsername,
                        score,
                        address: userAddress,
                        isClient,
                        txHash: tx2.hash,
                        step1TxHash: tx1.hash,
                        blockNumber: receipt2.blockNumber
                    }
                });
            }
        } else {
            console.log("Transaction failed with status:", receipt2.status);
            return NextResponse.json({
                status: 'error',
                result: false,
                message: 'Verification failed in step 2',
                details: {
                    githubUsername,
                    score,
                    isClient,
                    txHash: tx2.hash,
                    step1TxHash: tx1.hash,
                    receipt: receipt2
                }
            }, { status: 400 });
        }
    } catch (error) {
        console.error("Error in verification process:", error);
        
        // Try to decode error reason if possible
        let errorMessage = 'Verification failed';
        if (error && typeof error === 'object') {
            // Log detailed error information
            if ('data' in error) {
                console.log("Error data:", error.data);
                try {
                    // Common error codes for GitIgnore contract
                    if (error.data === '0x725a844f') {
                        errorMessage = "Invalid scope or attestation ID";
                    } else if (error.data === '0x82b42900') {
                        errorMessage = "Proof already used (registered nullifier)";
                    } else if (error.data === '0x2163950f') {
                        errorMessage = "User not registered";
                    } else if (error.data && typeof error.data === 'string' && error.data.includes('ScoreTooLow')) {
                        errorMessage = "Score below threshold (60)";
                    } else if (error.data && typeof error.data === 'string' && error.data.includes('InvalidGithubUsername')) {
                        errorMessage = "Invalid GitHub username";
                    } else {
                        errorMessage = `Contract error: ${error.data}`;
                    }
                } catch (_) {
                    // Unable to decode error
                }
            }
            
            // Log error codes
            if ('code' in error) {
                console.log("Error code:", error.code);
            }
        }
        
        return NextResponse.json({
            status: 'error',
            result: false,
            message: errorMessage,
            details: {
                githubUsername,
                score,
                isClient,
                error: error instanceof Error ? error.message : String(error)
            }
        }, { status: 400 });
    }
} catch (error: any) {
    console.error('Error verifying proof:', error);
    return NextResponse.json({
        status: 'error',
        message: 'Error verifying proof',
        result: false,
        error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
}
}