'use client';

import React, { useState, useEffect } from 'react';
import SelfQRcodeWrapper, { SelfApp, SelfAppBuilder } from '@selfxyz/qrcode';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { Wallet, Github, Code2, UserCircle, ArrowRight } from "lucide-react";
import { logo } from '../content/birthdayAppLogo';
import Link from "next/link";

function PassportVerifier() {
    const [verificationStatus, setVerificationStatus] = useState<{
        verified: boolean;
        score: number;
        githubUsername: string;
    } | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStep, setVerificationStep] = useState<string | null>(null);
    
    // Wallet states
    const [walletConnected, setWalletConnected] = useState(false);
    const [connectingWallet, setConnectingWallet] = useState(false);
    const [userAddress, setUserAddress] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [githubUsername, setGithubUsername] = useState<string | null>(null);

    // Connect wallet function with real wallet integration
    const connectWallet = async () => {
        setConnectingWallet(true);
        
        if (typeof window !== 'undefined' && window.ethereum !== undefined) {
            try {
                const newProvider = new ethers.BrowserProvider(window.ethereum);
                const newSigner = await newProvider.getSigner();
                const address = await newSigner.getAddress();
                // Store connection data in localStorage
                localStorage.setItem('walletConnected', 'true');
                localStorage.setItem('userAddress', address);
                
                // Update state
                setProvider(newProvider);
                setSigner(newSigner);
                setUserAddress(address);
                setWalletConnected(true);
                setConnectingWallet(false);
            } catch (error) {
                console.error("Error connecting wallet:", error);
                setConnectingWallet(false);
            }
        } else {
            alert("Please install MetaMask");
            setConnectingWallet(false);
        }
    };

    // Disconnect wallet function
    const disconnectWallet = () => {
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('userAddress');
        setWalletConnected(false);
        setUserAddress(null);
        setProvider(null);
        setSigner(null);
        setVerificationStatus(null);
    };

    // Check if wallet is already connected
    useEffect(() => {
        if (typeof window === 'undefined' || window.ethereum === undefined) return;

        // Check localStorage first
        const storedConnection = localStorage.getItem('walletConnected');
        const storedAddress = localStorage.getItem('userAddress');
        
        if (storedConnection === 'true' && storedAddress) {
            // Verify the connection is still valid
            window.ethereum.request({ method: 'eth_accounts' })
                .then(async (accounts: string[]) => {
                    if (accounts.length > 0 && accounts[0].toLowerCase() === storedAddress.toLowerCase()) {
                        // Connection is still valid
                        const newProvider = new ethers.BrowserProvider(window.ethereum);
                        const newSigner = await newProvider.getSigner();
                        const address = await newSigner.getAddress();
                        
                      
                        setProvider(newProvider);
                        setSigner(newSigner);
                        setUserAddress(address);
                        setWalletConnected(true);
                    } else {
                        // Connection is no longer valid
                        disconnectWallet();
                    }
                })
                .catch((error: any) => {
                    console.error("Error checking wallet connection:", error);
                    disconnectWallet();
                });
        }

    }, [userAddress]);

    // Configure Self app when wallet address is available
    const selfApp = userAddress ? new SelfAppBuilder({
        appName: "GitIgnore",
        scope: "git-ignore",
        // endpoint: "https://happy-birthday-rho-nine.vercel.app/api/verify",
        // run `ngrok http 3000` and copy the url here to test locally
        endpoint: `https://7d78-111-235-226-130.ngrok-free.app/api/verify?isClient=false&githubUsername=${githubUsername}`,
        logoBase64: logo,
        userId: userAddress,
        userIdType: "hex",
        
        devMode: true,
    } as Partial<SelfApp>).build() : null;


    const handleSuccess = (result: any) => {
        console.log('Verification process initiated', result);
        setIsVerifying(true);
        setVerificationStep("Starting verification process...");
        
        // Simulate the steps of the verification process
        setTimeout(() => {
            setVerificationStep("1. Self Passport verification successful");
            
            setTimeout(() => {
                setVerificationStep("2. GitHub username retrieved");
                
                setTimeout(() => {
                    setVerificationStep("3. GitHub analysis score: 67");
                    
                    setTimeout(() => {
                        setVerificationStep("4. Calling smart contract for verification");
                        
                        setTimeout(() => {
                            setVerificationStep("Verification complete!");
                            
                            // Set the final verification status
                            if (result && result.credentialSubject) {
                                setVerificationStatus({
                                    verified: true,
                                    score: result.credentialSubject.score || 67,
                                    githubUsername: result.credentialSubject.githubUsername || 'github-user'
                                });
                            } else {
                                // For demo purposes when no result is returned
                                setVerificationStatus({
                                    verified: true,
                                    score: 67,
                                    githubUsername: `github-user-${userAddress?.substring(0, 6)}`
                                });
                            }
                            
                            setIsVerifying(false);
                            setVerificationStep(null);
                        }, 2000);
                    }, 2000);
                }, 1500);
            }, 1500);
        }, 1500);
    };

    return (
        <div className="flex min-h-screen flex-col bg-dark-900 text-white">
            <nav className="w-full border-b border-gray-800 py-4 px-6 flex items-center justify-between bg-dark-900">
                <Link href="/" className="flex items-center">
                    <h1 className="text-2xl font-extrabold font-prompt text-white">DevCollab<span className="text-yellow-500">.ai</span></h1>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/chat" className="text-gray-300 hover:text-white transition-colors">
                        Projects
                    </Link>
                    <Link href="/developers" className="text-gray-300 hover:text-white transition-colors">
                        Developers
                    </Link>
                    <Link href="/self" className="text-white font-bold">
                        Verify
                    </Link>
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-4xl mx-auto">
                    

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mt-8">
                        <div className="flex flex-col space-y-6 border-4 border-yellow-500 p-6 bg-dark-800">
                            
                            
                            {!walletConnected ? (
                                <Button 
                                    onClick={connectWallet}
                                    disabled={connectingWallet}
                                    className="bg-yellow-500 text-black hover:bg-yellow-400 text-lg p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all"
                                >
                                    <span className="flex items-center gap-2">
                                        {connectingWallet ? 'Connecting...' : 'Connect Wallet'} <Wallet size={20} />
                                    </span>
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="font-bold text-green-400">Connected</span>
                                    </div>
                                    
                                    <div>
                                        <span className="text-sm text-gray-400">Address:</span>
                                        <div className="font-mono text-sm bg-dark-700 p-2 border border-dark-600 rounded mt-1 overflow-auto">
                                            {userAddress}
                                        </div>
                                    </div>
                                    
                                    
                                    <div className="pt-2">
                                        <Button 
                                            variant="outline" 
                                            onClick={disconnectWallet}
                                            className="w-full bg-transparent text-red-400 border border-red-400 hover:bg-red-900 hover:text-red-300"
                                        >
                                            Disconnect Wallet
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col space-y-6 border-4 border-yellow-500 p-6 bg-dark-800">
                            <div className="text-center mb-2">
                                <h2 className="text-2xl font-bold mb-4">Step 2: Verify GitHub Identity</h2>
                                <div className="flex flex-col space-y-2">
                                    <label htmlFor="github-username" className="text-sm text-gray-300">Enter your GitHub username</label>
                                    <input 
                                        id="github-username"
                                        type="text" 
                                        placeholder="e.g. octocat" 
                                        value={githubUsername || ''}
                                        onChange={(e) => setGithubUsername(e.target.value)} 
                                        className="p-2 bg-dark-700 border border-gray-600 rounded text-white"
                                    />
                                </div>
                            </div>
                            
                            <p className="text-gray-300">
                                Scan the QR code with your Self app to verify your GitHub credentials
                            </p>

                            {walletConnected && selfApp && githubUsername ? (
                                <div className="flex justify-center mt-4">
                                    <SelfQRcodeWrapper
                                        selfApp={selfApp}
                                        type='websocket'
                                        onSuccess={() => handleSuccess(null)}
                                    />
                                </div>
                            ) : walletConnected && !githubUsername ? (
                                <div className="flex flex-col justify-center items-center h-40 bg-dark-700 border-2 border-dark-600">
                                    <Github size={32} className="text-gray-500 mb-4" />
                                    <p className="text-gray-500">Please enter your GitHub username</p>
                                </div>
                            ) : (
                                <div className="flex flex-col justify-center items-center h-64 bg-dark-700 border-2 border-dark-600">
                                    <Wallet size={32} className="text-gray-500 mb-4" />
                                    <p className="text-gray-500">Connect your wallet first</p>
                                    <p className="text-gray-600 text-sm mt-2">Your wallet address will be used to link with GitHub</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {isVerifying && (
                        <div className="mt-8 p-6 border-4 border-yellow-500 bg-dark-800">
                            <h3 className="text-xl font-bold mb-4">Verification In Progress</h3>
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500 mr-3"></div>
                                <p className="text-yellow-500">{verificationStep}</p>
                            </div>
                        </div>
                    )}

                    {verificationStatus && (
                        <div className="mt-8 p-6 border-4 border-green-500 bg-dark-800">
                            <h3 className="text-xl font-bold mb-4">Identity Verification Complete</h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-dark-700 p-4 rounded-md border border-dark-600">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wallet size={20} className="text-yellow-500" />
                                            <span className="font-medium text-gray-300">Blockchain Identity</span>
                                        </div>
                                        <div className="font-mono text-sm text-yellow-500 break-all">
                                            {userAddress}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-dark-700 p-4 rounded-md border border-dark-600">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Github size={20} className="text-yellow-500" />
                                            <span className="font-medium text-gray-300">GitHub Username</span>
                                        </div>
                                        <div className="font-mono text-sm text-yellow-500">
                                            {verificationStatus.githubUsername}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-dark-700 p-4 rounded-md border border-dark-600">
                                    <div className="flex items-center gap-2 mb-2">
                                        <UserCircle size={20} className="text-yellow-500" />
                                        <span className="font-medium text-gray-300">Developer Score</span>
                                    </div>
                                    <div className="w-full bg-dark-600 h-3 rounded-full">
                                        <div 
                                            className={`h-3 rounded-full ${
                                                verificationStatus.score >= 70 ? 'bg-green-500' : 
                                                verificationStatus.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${verificationStatus.score}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>0</span>
                                        <span>{verificationStatus.score}/100</span>
                                        <span>100</span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-gray-700">
                                    <Button className="w-full bg-green-600 hover:bg-green-500 text-lg p-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all">
                                        <Link href="/developers/profile" className="flex items-center justify-center gap-2 w-full">
                                            Go to Developer Dashboard <ArrowRight size={20} />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default PassportVerifier;
