'use client';
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractABI from "../contracts/FreelanceProject.json";
import Link from 'next/link';

const CONTRACT_ADDRESS = "0x7A0399618B0bde2eeBdcAA4c1C9Da2883D118b3d";
const RPC_URL = "https://alfajores-forno.celo-testnet.org/";

interface Project {
  id: number;
  client: string;
  title: string;
  description: string;
  budget: number;
  isPaid: boolean;
  githubRepo: string;
  createdAt: number;
  modules: Module[];
}

interface Module {
  name: string;
  freelancer: string;
  percentageWeight: number;
  isCompleted: boolean;
  isApproved: boolean;
  submodules: Submodule[];
  bids: ModuleBid[];
}

interface Submodule {
  name: string;
  isCompleted: boolean;
}

interface ModuleBid {
  freelancer: string;
  bidAmount: ethers.BigNumberish;
  proposal: string;
  isApproved: boolean;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Connect wallet
  useEffect(() => {
    async function connectWallet() {
      if (typeof window === 'undefined') return;
      
      if (!window.ethereum) {
        setWalletError("Please install MetaMask to use this application");
        setLoading(false);
        return;
      }

      try {
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: "eth_requestAccounts" 
        });
        
        if (accounts && accounts.length > 0) {
          setUserAddress(accounts[0]);
        } else {
          setWalletError("No accounts found. Please connect your wallet.");
        }
      } catch (error: any) {
        console.error("Wallet connection error:", error);
        setWalletError(error.message || "Failed to connect wallet");
      } finally {
        setLoading(false);
      }
    }

    connectWallet();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
        } else {
          setUserAddress(null);
          setProjects([]);
        }
      });
    }
  }, []);

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      if (!userAddress) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.output.abi, provider);

        // Fetch projects where user is either the client or a freelancer
        const [clientProjects, freelancerProjects] = await Promise.all([
          contract.listProjectsByClient(userAddress),
          contract.listProjectsForFreelancer(userAddress)
        ]);

        // Combine and remove duplicates
        const allUserProjects = [...clientProjects, ...freelancerProjects];
        const uniqueProjects = Array.from(new Set(allUserProjects.map(p => p.id)))
          .map(id => allUserProjects.find(p => p.id === id));

        setProjects(uniqueProjects);
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        setError(error.message || "Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [userAddress]);

  if (walletError) {
    return (
      <div className="min-h-screen bg-yellow-100 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Wallet Error</h1>
          <p className="text-2xl text-red-600">{walletError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-100 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Loading Projects</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-yellow-100 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-2xl text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-yellow-100 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">No Projects Found</h1>
          <p className="text-xl">You don't have any projects yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">My Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link 
            href={`/projects/${project.id}`} 
            key={project.id}
            className="block"
          >
            <div
              className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              <h2 className="text-2xl font-bold mb-4">{project.title}</h2>
              <p className="text-gray-700 mb-4">{project.description}</p>
              <div className="space-y-2">
                <p className="font-semibold">Budget: {ethers.formatEther(project.budget)} cUSD</p>
                <p className="font-semibold">Status: {project.isPaid ? "Paid" : "Unpaid"}</p>
                <p className="font-semibold">Role: {
                  project.client.toLowerCase() === userAddress?.toLowerCase() 
                    ? "Client" 
                    : "Freelancer"
                }</p>
              </div>
              <div className="mt-4">
                <h3 className="font-bold mb-2">Modules:</h3>
                <div className="space-y-2">
                  {project.modules.map((module, index) => (
                    <div key={index} className="bg-yellow-50 p-2 rounded border border-black">
                      <p className="font-semibold">{module.name}</p>
                      <p className="text-sm">Status: {module.isCompleted ? "Completed" : "In Progress"}</p>
                      {module.bids.length > 0 && (
                        <p className="text-sm">Bids: {module.bids.length}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 