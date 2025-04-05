'use client';
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractABI from "../../contracts/FreelanceProject.json";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
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
          setProject(null);
        }
      });
    }
  }, []);

  // Fetch project
  useEffect(() => {
    async function fetchProject() {
      if (!userAddress || !projectId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.output.abi, provider);

        // Get basic project details from the projects mapping
        const basicProjectData = await contract.projects(projectId);
        
        // Try multiple ways to get the full project with modules
        let fullProject = null;
        
        // First try to find it in client projects
        const clientProjects = await contract.listProjectsByClient(basicProjectData.client);
        fullProject = clientProjects.find((p: any) => p.id.toString() === projectId.toString());
        
        // If not found (or if access is needed for a non-client), try freelancer projects
        if (!fullProject) {
          const freelancerProjects = await contract.listProjectsForFreelancer(userAddress);
          fullProject = freelancerProjects.find((p: any) => p.id.toString() === projectId.toString());
        }
        
        // If still not found, try listing all ongoing projects (if the contract supports it)
        if (!fullProject) {
          try {
            const ongoingProjects = await contract.listOngoingProjects();
            fullProject = ongoingProjects.find((p: any) => p.id.toString() === projectId.toString());
          } catch (err) {
            console.log("Could not fetch from ongoing projects, continuing with basic data");
          }
        }
        
        // If we still don't have a full project with modules, create a structure with the basic data
        if (!fullProject) {
          console.log("Creating project from basic data");
          fullProject = {
            ...basicProjectData,
            modules: [] // No modules available from the basic mapping
          };
        }
        
        console.log("Project data:", fullProject);
        setProject(fullProject);
      } catch (error: any) {
        console.error("Error fetching project:", error);
        setError(error.message || "Failed to fetch project");
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [userAddress, projectId]);

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
          <h1 className="text-4xl font-bold mb-4">Loading Project</h1>
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

  if (!project) {
    return (
      <div className="min-h-screen bg-yellow-100 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
          <p className="text-xl">The project you are looking for does not exist or you do not have permission to view it.</p>
          <Link 
            href="/projects" 
            className="mt-4 inline-block px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-4xl font-bold">{project.title}</h1>
          <Link 
            href="/projects" 
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Projects
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Project Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="font-semibold">Client:</p>
              <p className="font-mono break-all">{project.client}</p>
            </div>
            <div>
              <p className="font-semibold">Budget:</p>
              <p>{typeof project.budget === 'bigint' || typeof project.budget === 'string' ? 
                ethers.formatEther(project.budget) : 
                Number(project.budget) / 1e18} ETH</p>
            </div>
            <div>
              <p className="font-semibold">Status:</p>
              <p>{project.isPaid ? "Paid" : "Unpaid"}</p>
            </div>
            <div>
              <p className="font-semibold">Created At:</p>
              <p>{project.createdAt ? 
                new Date(Number(project.createdAt) * 1000).toLocaleDateString() : 
                "Not available"}</p>
            </div>
            {project.githubRepo && (
              <div className="col-span-2">
                <p className="font-semibold">GitHub Repository:</p>
                <a 
                  href={project.githubRepo.startsWith('http') ? project.githubRepo : `https://github.com/${project.githubRepo}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {project.githubRepo}
                </a>
              </div>
            )}
          </div>
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">Description</h3>
            <p className="whitespace-pre-wrap">{project.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-6">
          <h2 className="text-2xl font-bold mb-4">Modules</h2>
          {!project.modules || project.modules.length === 0 ? (
            <p>No modules have been created for this project yet.</p>
          ) : (
            <div className="space-y-4">
              {project.modules.map((module, index) => (
                <div key={index} className="bg-yellow-50 p-4 rounded-lg border border-black">
                  <h3 className="text-xl font-semibold mb-2">{module.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    <div>
                      <p className="font-semibold">Weight:</p>
                      <p>{Number(module.percentageWeight)}%</p>
                    </div>
                    <div>
                      <p className="font-semibold">Status:</p>
                      <p>
                        {module.isCompleted ? 'Completed' : 'In Progress'}
                        {module.isApproved ? ' (Approved)' : ''}
                      </p>
                    </div>
                    {module.freelancer && module.freelancer !== ethers.ZeroAddress && (
                      <div className="col-span-2">
                        <p className="font-semibold">Freelancer:</p>
                        <p className="font-mono break-all">{module.freelancer}</p>
                      </div>
                    )}
                  </div>

                  {module.submodules && module.submodules.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Submodules:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {module.submodules.map((submodule, subIdx) => (
                          <div key={subIdx} className="p-2 bg-white rounded border border-gray-300">
                            <p className="font-medium">{submodule.name}</p>
                            <p className="text-sm">
                              Status: {submodule.isCompleted ? 'Completed' : 'In Progress'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {module.bids && module.bids.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Bids:</h4>
                      <div className="space-y-2">
                        {module.bids.map((bid, bidIdx) => (
                          <div key={bidIdx} className="p-2 bg-white rounded border border-gray-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              <div>
                                <p className="text-sm font-medium">Freelancer:</p>
                                <p className="text-sm font-mono truncate">{bid.freelancer}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Bid Amount:</p>
                                <p className="text-sm">{ethers.formatEther(bid.bidAmount)} ETH</p>
                              </div>
                            </div>
                            <div className="mt-1">
                              <p className="text-sm font-medium">Proposal:</p>
                              <p className="text-sm whitespace-pre-wrap">{bid.proposal}</p>
                            </div>
                            <p className="text-sm mt-1">
                              Status: {bid.isApproved ? 'Approved' : 'Pending'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
