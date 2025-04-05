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
    <div>
      <h2>Client's Projects</h2>
      {projects.map((project) => (
        <div key={project.id} className="border p-4 my-4">
          <h3>{project.title}</h3>
          {project.modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="p-4 border my-2">
              <h4>{module.name}</h4>
              {module.bids.map((bid, bidIndex) => (
                <div key={bidIndex} className="p-2 border my-2">
                  <p>Freelancer: {bid.freelancer}</p>
                  <p>Bid Amount: {ethers.formatEther(bid.bidAmount)} ETH</p>
                  <p>Proposal: {bid.proposal}</p>
                  {module.freelancer && (
                    <button onClick={() => acceptBid(project.id, moduleIndex, bidIndex)} className="bg-blue-500 text-white p-2">
                      Accept Bid
                    </button>
                  )}
                </div>
              ))}
              {module.freelancer && !module.isCompleted && (
                <button onClick={() => markComplete(project.id, moduleIndex)} className="bg-green-500 text-white p-2">
                  Mark as Complete
                </button>
              )}
              {module.freelancer && (
                <button onClick={() => releaseFunds(project.id, moduleIndex)} className="bg-red-500 text-white p-2">
                  Release Funds
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
