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
        <div className="flex min-h-screen flex-col bg-[#fffdf7]">
            <nav className="w-full border-b-4 border-black py-6 px-8 flex items-center justify-between bg-white shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
                <Link href="/" className="flex items-center">
                    <h1 className="text-2xl font-extrabold font-prompt text-black drop-shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
                        gitDontignore.ai
                        <span className="ml-2 inline-block -rotate-3 bg-yellow-300 text-xs px-2 py-0.5 rounded-lg border-2 border-black">Verification</span>
                    </h1>
                </Link>
                <div className="flex items-center gap-6">
                    <Link href="/chat" className="font-bold text-black hover:underline decoration-4 underline-offset-4">
                        Projects
                    </Link>
                    <Link href="/developers" className="font-bold text-black hover:underline decoration-4 underline-offset-4">
                        Developers
                    </Link>
                    <Link href="/self" className="font-bold px-3 py-2 bg-black text-white border-2 border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.8)] transition-all">
                        Verify
                    </Link>
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-4xl mx-auto">
                    <div className="bg-white border-4 border-black p-6 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10">
                        <h1 className="text-4xl font-extrabold mb-6 text-black drop-shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
                            Developer Identity Verification
                        </h1>
                        <p className="text-gray-700 text-lg mb-6 font-medium">
                            Connect your wallet and verify your GitHub identity to join our developer marketplace
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white rounded-lg border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h2 className="text-2xl font-bold mb-6 border-b-4 border-black pb-2 flex items-center">
                                <div className="bg-yellow-300 w-8 h-8 rounded-full border-2 border-black flex items-center justify-center mr-3 font-bold">1</div>
                                Connect Wallet
                            </h2>
                            
                            {!walletConnected ? (
                                <button 
                                    onClick={connectWallet}
                                    disabled={connectingWallet}
                                    className="w-full py-4 bg-yellow-400 text-black rounded-md transition-all border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:translate-x-1 font-bold text-lg"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {connectingWallet ? 'Connecting...' : 'Connect Wallet'} <Wallet size={20} />
                                    </span>
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 bg-green-100 p-3 rounded-md border-2 border-green-600">
                                        <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="font-bold text-green-700">Wallet Connected</span>
                                    </div>
                                    
                                    <div>
                                        <span className="text-sm font-bold text-gray-700">Your Address:</span>
                                        <div className="font-mono text-sm bg-gray-100 p-3 rounded-md border-2 border-black mt-1 overflow-auto">
                                            {userAddress}
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={disconnectWallet}
                                        className="w-full py-2 bg-white text-red-600 rounded-md border-2 border-red-600 shadow-[3px_3px_0px_0px_rgba(220,38,38,0.8)] hover:shadow-[1px_1px_0px_0px_rgba(220,38,38,0.8)] hover:translate-y-0.5 hover:translate-x-0.5 transition-all font-bold"
                                    >
                                        Disconnect Wallet
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-lg border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <h2 className="text-2xl font-bold mb-6 border-b-4 border-black pb-2 flex items-center">
                                <div className="bg-blue-300 w-8 h-8 rounded-full border-2 border-black flex items-center justify-center mr-3 font-bold">2</div>
                                Verify GitHub
                            </h2>
                            
                            <div className="mb-4">
                                <label htmlFor="github-username" className="block text-sm font-bold text-gray-700 mb-2">Enter your GitHub username</label>
                                <input 
                                    id="github-username"
                                    type="text" 
                                    placeholder="e.g. octocat" 
                                    value={githubUsername || ''}
                                    onChange={(e) => setGithubUsername(e.target.value)} 
                                    className="w-full p-3 bg-gray-100 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all"
                                />
                            </div>
                            
                            <p className="text-gray-700 font-medium mb-4">
                                Scan the QR code with your Self app to verify your GitHub credentials
                            </p>

                            {walletConnected && selfApp && githubUsername ? (
                                <div className="flex justify-center mt-4 bg-white p-4 border-2 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                                    <SelfQRcodeWrapper
                                        selfApp={selfApp}
                                        type='websocket'
                                        onSuccess={() => handleSuccess(null)}
                                    />
                                </div>
                            ) : walletConnected && !githubUsername ? (
                                <div className="flex flex-col justify-center items-center h-44 bg-gray-100 border-2 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                                    <Github size={40} className="text-gray-700 mb-4" />
                                    <p className="text-gray-700 font-bold">Please enter your GitHub username</p>
                                </div>
                            ) : (
                                <div className="flex flex-col justify-center items-center h-44 bg-gray-100 border-2 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                                    <Wallet size={40} className="text-gray-700 mb-4" />
                                    <p className="text-gray-700 font-bold">Connect your wallet first</p>
                                    <p className="text-gray-600 text-sm mt-2">Your wallet will be linked to your GitHub identity</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {isVerifying && (
                        <div className="bg-white rounded-lg border-4 border-yellow-400 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                            <h3 className="text-xl font-bold mb-4 flex items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-4 border-blue-600 mr-3"></div>
                                Verification In Progress
                            </h3>
                            <div className="bg-yellow-100 p-3 rounded-md border-2 border-yellow-400">
                                <p className="text-gray-800 font-bold">{verificationStep}</p>
                            </div>
                        </div>
                    )}

                    {verificationStatus && (
                        <div className="bg-white rounded-lg border-4 border-green-500 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                            <div className="flex items-center mb-6">
                                <div className="bg-green-400 w-10 h-10 rounded-full border-2 border-black flex items-center justify-center mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <h3 className="text-2xl font-bold">Identity Verification Complete</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-100 p-4 rounded-md border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wallet size={20} className="text-black" />
                                            <span className="font-bold text-gray-800">Blockchain Identity</span>
                                        </div>
                                        <div className="font-mono text-sm bg-white p-2 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] break-all">
                                            {userAddress}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-100 p-4 rounded-md border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Github size={20} className="text-black" />
                                            <span className="font-bold text-gray-800">GitHub Link</span>
                                        </div>
                                        <div className="font-mono text-lg font-bold bg-white p-2 border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                                              https://github.com/{githubUsername}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-100 p-4 rounded-md border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <UserCircle size={20} className="text-black" />
                                        <span className="font-bold text-gray-800">Developer Score</span>
                                    </div>
                                    <div className="w-full bg-white h-6 rounded-md border-2 border-black">
                                        <div 
                                            className={`h-full rounded-sm ${
                                                verificationStatus.score >= 70 ? 'bg-green-500' : 
                                                verificationStatus.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                            } border-r-2 border-black`}
                                            style={{ width: `${verificationStatus.score}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="font-bold">{verificationStatus.score}/100</span>
                                        <span className={`px-2 py-0.5 rounded border-2 border-black ${
                                            verificationStatus.score >= 70 ? 'bg-green-300' : 
                                            verificationStatus.score >= 40 ? 'bg-yellow-300' : 'bg-red-300'
                                        } font-bold`}>
                                            {verificationStatus.score >= 70 ? 'Excellent' : 
                                            verificationStatus.score >= 40 ? 'Good' : 'Needs Improvement'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div>
                                    <button 
                                        onClick={() => window.location.href = '/developers/profile'}
                                        className="w-full py-4 bg-blue-500 text-white rounded-md transition-all border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:translate-x-1 font-bold text-lg flex items-center justify-center gap-2"
                                    >
                                        Go to Developer Dashboard <ArrowRight size={20} />
                                    </button>
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
