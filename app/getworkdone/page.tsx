'use client';
import { useState, useEffect } from "react";
import { ethers, Contract, Signer, JsonRpcProvider } from "ethers";
import contractABI from "../contracts/FreelanceProject.json";

const CONTRACT_ADDRESS = "0x7A0399618B0bde2eeBdcAA4c1C9Da2883D118b3d";
const RPC_URL = "https://alfajores-forno.celo-testnet.org/"; // Replace with actual RPC URL

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

interface Module {
  name: string;
  freelancer: string;
  percentageWeight: number;
  isCompleted: boolean;
  isApproved: boolean;
  submodules: Submodule[];
  bids: ModuleBid[];
}

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

interface ProjectBidsProps {
  provider: JsonRpcProvider;
  signer: Signer;
}

export default function ProjectBids() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientAddress, setClientAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    async function getAccount() {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          if (accounts.length > 0) {
            setClientAddress(accounts[0]);
          }
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      } else {
        console.log("MetaMask is not installed!");
      }
    }
    getAccount();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);
    }
  }, []);

  useEffect(() => {
    async function fetchClientProjects() {
      if (!clientAddress) return; // 🛑 Prevent function call if address is null
      try {
        const rpcProvider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.output.abi, rpcProvider);

        console.log("Fetching projects for client:", clientAddress);

        // Encode function call
        const encodedFunctionData = contract.interface.encodeFunctionData("listProjectsByClient", [clientAddress]);

        // Call contract manually
        const rawResult = await rpcProvider.call({
          to: CONTRACT_ADDRESS,
          data: encodedFunctionData,
        });

        // Decode returned data
        const decodedResult = contract.interface.decodeFunctionResult("listProjectsByClient", rawResult);
        console.log("Decoded Projects:", decodedResult);

        setProjects(decodedResult[0]); // Assuming it's the first returned array
      } catch (error) {
        console.error("Error fetching client projects:", error);
      }
    }

    fetchClientProjects();
  }, [clientAddress]);

  const [signer, setSigner] = useState<Signer | null>(null);

  useEffect(() => {
    async function getSigner() {
      if (provider) {
        try {
          const signer = await provider.getSigner();
          setSigner(signer);
        } catch (error) {
          console.error("Error getting signer:", error);
        }
      }
    }

    getSigner();
  }, [provider]);
  


  const contract = new Contract(CONTRACT_ADDRESS, contractABI.output.abi, signer);
  const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, contractABI.output.abi, signer);

  async function acceptBid(projectId: number, moduleIndex: number, bidIndex: number) {
    try {
      const tx = await contractWithSigner.approveModuleBid(projectId, moduleIndex, bidIndex);
      await tx.wait();
      alert("Bid approved!");
    } catch (error) {
      console.error("Error approving bid:", error);
    }
  }

  async function markComplete(projectId: number, moduleIndex: number) {
    try {
      const tx = await contractWithSigner.markModuleComplete(projectId, moduleIndex);
      await tx.wait();
      alert("Module marked as complete!");
    } catch (error) {
      console.error("Error marking complete:", error);
    }
  }

  async function approveModule(projectId: number, moduleIndex: number) {
    try {
      const tx = await contractWithSigner.approveModule(projectId, moduleIndex);
      await tx.wait();
      alert("Module approved!");
    } catch (error) {
      console.error("Error approving module:", error);
    }
  }

  async function releaseFunds(projectId: number, moduleIndex: number) {
    try {
      const tx = await contractWithSigner.releaseModuleFunds(projectId, moduleIndex);
      await tx.wait();
      alert("Funds released!");
    } catch (error) {
      console.error("Error releasing funds:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffdf7] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 bg-white p-6 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-5xl font-extrabold font-prompt text-black drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
            Your Projects
            <span className="ml-3 inline-block -rotate-3 bg-yellow-300 text-sm px-3 py-1 rounded-lg border-2 border-black">Client Dashboard</span>
          </h1>
          <div className="px-4 py-2 bg-black text-white rounded-md border-2 border-black">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-mono">{clientAddress ? `${clientAddress.substring(0, 6)}...${clientAddress.substring(clientAddress.length - 4)}` : 'Connect Wallet'}</span>
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 mx-auto mb-4 text-gray-400"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
            <p className="text-xl font-bold">No projects found</p>
            <p className="text-gray-500 mt-2">You don't have any projects yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-6">
                <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-black">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{project.title}</h2>
                    <p className="text-gray-600 font-medium">{project.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-yellow-300 px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] font-bold">
                      {ethers.formatEther(project.budget)} cUSD
                    </div>
                    {project.githubRepo && (
                      <a 
                        href={project.githubRepo.startsWith('http') ? project.githubRepo : `https://github.com/${project.githubRepo}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm bg-gray-200 px-2 py-1 rounded border border-black"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                        Repository
                      </a>
                    )}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-4 border-b-2 border-dashed border-gray-300 pb-2">Modules</h3>
                <div className="grid grid-cols-1 gap-6">
                  {project.modules.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="bg-gray-50 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] p-4">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                        <h4 className="text-lg font-bold">{module.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded border border-blue-800">
                            {module.percentageWeight}% of budget
                          </span>
                          
                          {module.isCompleted ? (
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded border border-green-800">
                              Completed
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded border border-yellow-800">
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1">Freelancer:</p>
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded border border-gray-300">
                          {module.freelancer && module.freelancer !== "0x0000000000000000000000000000000000000000" 
                            ? module.freelancer 
                            : "Not assigned yet"}
                        </div>
                      </div>
                      
                      {module.bids && module.bids.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-bold text-sm border-b border-gray-200 pb-1 mb-2">Developer Bids ({module.bids.length})</h5>
                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {module.bids.map((bid, bidIndex) => (
                              <div key={bidIndex} className="bg-white p-3 rounded-md border-2 border-black">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="font-mono text-sm">{bid.freelancer.substring(0, 6)}...{bid.freelancer.substring(bid.freelancer.length - 4)}</div>
                                  <div className="bg-yellow-100 px-2 py-1 rounded text-xs font-bold border border-yellow-500">
                                    {ethers.formatEther(bid.bidAmount)} cUSD
                                  </div>
                                </div>
                                
                                <div className="bg-gray-50 p-2 rounded border border-gray-200 mb-2 text-sm">
                                  {bid.proposal}
                                </div>
                                
                                {!module.freelancer || module.freelancer === "0x0000000000000000000000000000000000000000" ? (
                                  <button 
                                    onClick={() => acceptBid(project.id, moduleIndex, bidIndex)}
                                    className="w-full px-3 py-2 bg-blue-500 text-white rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] transition-all text-sm font-bold"
                                  >
                                    Accept Bid
                                  </button>
                                ) : (
                                  bid.isApproved ? (
                                    <div className="bg-green-100 p-2 rounded border border-green-500 text-center text-sm font-bold text-green-800">
                                      Bid Accepted
                                    </div>
                                  ) : (
                                    <div className="bg-gray-100 p-2 rounded border border-gray-300 text-center text-sm text-gray-500">
                                      Module Already Assigned
                                    </div>
                                  )
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-200">
                        {module.freelancer && !module.isCompleted && (
                          <button 
                            onClick={() => markComplete(project.id, moduleIndex)}
                            className="px-4 py-2 bg-green-500 text-white rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] transition-all text-sm font-bold"
                          >
                            Mark as Complete
                          </button>
                        )}
                        
                        {module.freelancer && module.isCompleted && !module.isApproved && (
                          <button 
                            onClick={() => approveModule(project.id, moduleIndex)}
                            className="px-4 py-2 bg-purple-500 text-white rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] transition-all text-sm font-bold"
                          >
                            Approve Module
                          </button>
                        )}
                        
                        {module.freelancer && module.isApproved && (
                          <button 
                            onClick={() => releaseFunds(project.id, moduleIndex)}
                            className="px-4 py-2 bg-orange-500 text-white rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] transition-all text-sm font-bold"
                          >
                            Release Funds
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
