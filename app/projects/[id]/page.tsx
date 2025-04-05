'use client';
import { useState, useEffect } from "react";
import { ethers, Contract, Signer, JsonRpcProvider } from "ethers";
import { useParams } from "next/navigation";
import contractABI from "../../contracts/FreelanceProject.json";

const CONTRACT_ADDRESS = "0x7A0399618B0bde2eeBdcAA4c1C9Da2883D118b3d";
const RPC_URL = "https://alfajores-forno.celo-testnet.org/";

interface Project {
  id: bigint;
  client: string;
  title: string;
  description: string;
  budget: bigint;
  isPaid: boolean;
  githubRepo: string;
  createdAt: bigint;
  modules: Module[];
}

interface Module {
  name: string;
  freelancer: string;
  percentageWeight: bigint;
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
  bidAmount: bigint;
  proposal: string;
  isApproved: boolean;
}

export default function ProjectDetail() {
  const params = useParams();
  const projectId = BigInt(params.id as string);
  
  const [project, setProject] = useState<Project | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [bidProposal, setBidProposal] = useState<string>("");
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [markCompleteSuccess, setMarkCompleteSuccess] = useState(false);
  const [approvingBid, setApprovingBid] = useState(false);
  const [releasingFunds, setReleasingFunds] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [isFreelancer, setIsFreelancer] = useState<boolean>(false);
  const [githubOwner, setGithubOwner] = useState<string>("");
  const [githubRepoName, setGithubRepoName] = useState<string>("");

  // Connect wallet and get user address
  useEffect(() => {
    async function connectWallet() {
      if (typeof window === 'undefined') return;
      
      if (!window.ethereum) {
        setError("Please install MetaMask to use this application");
        setLoading(false);
        return;
      }

      try {
        const accounts = await window.ethereum.request({ 
          method: "eth_requestAccounts" 
        });
        
        if (accounts && accounts.length > 0) {
          setUserAddress(accounts[0]);
        }
      } catch (error: any) {
        console.error("Wallet connection error:", error);
        setError(error.message || "Failed to connect wallet");
      }
    }

    connectWallet();
  }, []);

  // Initialize provider
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);
    }
  }, []);

  // Get signer from provider
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

  // Parse GitHub repository URL to get owner and repo name
  useEffect(() => {
    if (project?.githubRepo) {
      try {
        const url = new URL(project.githubRepo);
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
          setGithubOwner(pathParts[0]);
          setGithubRepoName(pathParts[1]);
        }
      } catch (error) {
        console.error("Error parsing GitHub URL:", error);
      }
    }
  }, [project?.githubRepo]);

  // Fetch project data and determine user role
  useEffect(() => {
    async function fetchProject() {
      if (!projectId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.output.abi, provider);
        
        let projectData: Project | null = null;

        // First try to find the project in all ongoing projects
        const ongoingProjects = await contract.listOngoingProjects();
        console.log("Ongoing projects:", ongoingProjects);
        projectData = ongoingProjects.find((p: Project) => p.id === projectId);

        // If we have a user address, also check their specific projects
        if (!projectData && userAddress) {
          const [clientProjects, freelancerProjects] = await Promise.all([
            contract.listProjectsByClient(userAddress),
            contract.listProjectsForFreelancer(userAddress)
          ]);

          console.log("Client projects:", clientProjects);
          console.log("Freelancer projects:", freelancerProjects);

          const allUserProjects = [...clientProjects, ...freelancerProjects];
          projectData = allUserProjects.find((p: Project) => p.id === projectId);
        }

        if (!projectData) {
          console.error("Project not found with ID:", projectId.toString());
          setError("Project not found. Please check the project ID and try again.");
          return;
        }

        console.log("Found project:", projectData);
        setProject(projectData);

        // Determine user role
        if (userAddress) {
          const isProjectClient = userAddress.toLowerCase() === projectData.client.toLowerCase();
          setIsClient(isProjectClient);
          
          // Check if user is a freelancer on any module
          const isProjectFreelancer = projectData.modules.some(
            module => module.freelancer.toLowerCase() === userAddress.toLowerCase()
          );
          setIsFreelancer(isProjectFreelancer);
        }
      } catch (error: any) {
        console.error("Error fetching project:", error);
        setError(error.message || "Failed to fetch project. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId, userAddress]);

  // Function to refresh project data
  const refreshProjectData = async () => {
    if (!projectId) return;
    
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.output.abi, provider);
      
      const ongoingProjects = await contract.listOngoingProjects();
      const updatedProject = ongoingProjects.find((p: Project) => p.id === projectId);
      
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      console.error("Error refreshing project data:", error);
    }
  };

  // Function to submit a bid for a module
  const handleBidSubmit = async (moduleIndex: number) => {
    if (!userAddress || !project || !signer) {
      setError("Please connect your wallet first");
      return;
    }

    if (!bidAmount || !bidProposal) {
      setError("Please provide both bid amount and proposal");
      return;
    }

    setSubmittingBid(true);
    setError(null);

    try {
      // Create contract with signer
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, contractABI.output.abi, signer);

      // Convert bid amount to wei
      const bidAmountWei = ethers.parseEther(bidAmount);

      // Submit the bid
      const tx = await contractWithSigner.bidForModule(
        projectId,
        moduleIndex,
        bidAmountWei,
        bidProposal
      );

      // Wait for transaction to be mined
      await tx.wait();

      // Refresh project data
      await refreshProjectData();
      
      setBidSuccess(true);
      setBidAmount("");
      setBidProposal("");
      setSelectedModuleIndex(null);
    } catch (error: any) {
      console.error("Error submitting bid:", error);
      setError(error.message || "Failed to submit bid. Please try again.");
    } finally {
      setSubmittingBid(false);
    }
  };

  // Function to mark a module as complete
  const handleMarkComplete = async (moduleIndex: number) => {
    if (!userAddress || !project || !signer) {
      setError("Please connect your wallet first");
      return;
    }

    setMarkingComplete(true);
    setError(null);

    try {
      // Create contract with signer
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, contractABI.output.abi, signer);

      // Mark the module as complete
      const tx = await contractWithSigner.markModuleComplete(projectId, moduleIndex);

      // Wait for transaction to be mined
      await tx.wait();

      // Refresh project data
      await refreshProjectData();
      
      setMarkCompleteSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setMarkCompleteSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error marking module as complete:", error);
      setError(error.message || "Failed to mark module as complete. Please try again.");
    } finally {
      setMarkingComplete(false);
    }
  };

  // Function to accept a bid
  const handleAcceptBid = async (moduleIndex: number, bidIndex: number) => {
    if (!userAddress || !project || !signer) {
      setError("Please connect your wallet first");
      return;
    }

    setApprovingBid(true);
    setError(null);

    try {
      // Create contract with signer
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, contractABI.output.abi, signer);

      // Approve the bid
      const tx = await contractWithSigner.approveModuleBid(projectId, moduleIndex, bidIndex);

      // Wait for transaction to be mined
      await tx.wait();

      // Refresh project data
      await refreshProjectData();
      
      alert("Bid approved successfully!");
    } catch (error: any) {
      console.error("Error approving bid:", error);
      setError(error.message || "Failed to approve bid. Please try again.");
    } finally {
      setApprovingBid(false);
    }
  };

  // Function to release funds for a module
  const handleReleaseFunds = async (moduleIndex: number) => {
    if (!userAddress || !project || !signer) {
      setError("Please connect your wallet first");
      return;
    }

    setReleasingFunds(true);
    setError(null);

    try {
      // Create contract with signer
      const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, contractABI.output.abi, signer);

      // Release funds for the module
      const tx = await contractWithSigner.releaseModuleFunds(projectId, moduleIndex);

      // Wait for transaction to be mined
      await tx.wait();

      // Refresh project data
      await refreshProjectData();
      
      alert("Funds released successfully!");
    } catch (error: any) {
      console.error("Error releasing funds:", error);
      setError(error.message || "Failed to release funds. Please try again.");
    } finally {
      setReleasingFunds(false);
    }
  };

  // Function to open the bid form
  const openBidForm = (moduleIndex: number) => {
    setSelectedModuleIndex(moduleIndex);
    setBidSuccess(false);
  };

  // Function to close the bid form
  const closeBidForm = () => {
    setSelectedModuleIndex(null);
    setBidAmount("");
    setBidProposal("");
    setBidSuccess(false);
  };

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
          <p className="text-xl">The requested project could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">{project.title}</h1>
          <p className="text-xl text-gray-600 mb-6">A collaborative project on the blockchain</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-yellow-50 p-4 rounded border border-black">
              <h3 className="font-bold mb-2">Project Owner</h3>
              <p className="text-sm break-all">
                <span className="font-semibold">Wallet:</span> {project.client}
              </p>
              {githubOwner && (
                <p className="text-sm">
                  <span className="font-semibold">GitHub:</span> {githubOwner}
                </p>
              )}
            </div>
            
            <div className="bg-yellow-50 p-4 rounded border border-black">
              <h3 className="font-bold mb-2">Project Details</h3>
              <p>Budget: {ethers.formatEther(project.budget)} ETH</p>
              <p>Status: {project.isPaid ? "Paid" : "Unpaid"}</p>
              <p>Created: {new Date(Number(project.createdAt) * 1000).toLocaleDateString()}</p>
              <p>Your Role: {isClient ? "Client" : isFreelancer ? "Freelancer" : "Viewer"}</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded border border-black mb-6">
            <h3 className="font-bold mb-2">Project Description</h3>
            <p className="whitespace-pre-line">{project.description}</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded border border-black">
            <h3 className="font-bold mb-2">GitHub Repository</h3>
            <a 
              href={project.githubRepo} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              {githubOwner}/{githubRepoName}
            </a>
          </div>
        </div>
        
        {/* Modules Section */}
        <div className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Project Modules</h2>
          
          <div className="space-y-6">
            {project.modules.map((module, index) => (
              <div 
                key={index} 
                className="bg-yellow-50 p-6 rounded border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{module.name}</h3>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded ${
                      module.isCompleted ? "bg-green-200" : "bg-yellow-200"
                    }`}>
                      {module.isCompleted ? "Completed" : "In Progress"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-semibold">Freelancer</p>
                    <p className="text-sm">{module.freelancer || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Weight</p>
                    <p className="text-sm">{Number(module.percentageWeight)}%</p>
                  </div>
                </div>

                {module.submodules.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-bold mb-2">Submodules</h4>
                    <div className="space-y-2">
                      {module.submodules.map((submodule, subIndex) => (
                        <div 
                          key={subIndex}
                          className="flex justify-between items-center bg-white p-2 rounded border border-black"
                        >
                          <span>{submodule.name}</span>
                          <span className={`px-2 py-1 rounded text-sm ${
                            submodule.isCompleted ? "bg-green-200" : "bg-yellow-200"
                          }`}>
                            {submodule.isCompleted ? "Done" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons for freelancers */}
                {!isClient && (
                  <div className="mt-4 flex space-x-2">
                    {/* Place Bid button for modules without assigned freelancer */}
                    {!module.freelancer && (
                      <button
                        onClick={() => openBidForm(index)}
                        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                      >
                        Place Bid
                      </button>
                    )}
                    
                    {/* Mark as complete button for assigned freelancer */}
                    {module.freelancer && 
                     module.freelancer.toLowerCase() === userAddress?.toLowerCase() && 
                     !module.isCompleted && (
                      <button
                        onClick={() => handleMarkComplete(index)}
                        disabled={markingComplete}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {markingComplete ? "Marking..." : "Mark as Complete"}
                      </button>
                    )}
                  </div>
                )}

                {/* Action buttons for clients */}
                {isClient && (
                  <div className="mt-4 flex space-x-2">
                    {/* Release funds button for clients */}
                    {module.freelancer && module.isApproved && (
                      <button
                        onClick={() => handleReleaseFunds(index)}
                        disabled={releasingFunds}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {releasingFunds ? "Releasing..." : "Release Funds"}
                      </button>
                    )}
                  </div>
                )}

                {/* Success message for marking as complete */}
                {markCompleteSuccess && module.freelancer && 
                 module.freelancer.toLowerCase() === userAddress?.toLowerCase() && (
                  <div className="mt-2 p-2 bg-green-100 rounded border border-green-500">
                    <p className="text-green-700 font-semibold">Module marked as complete!</p>
                  </div>
                )}

                {/* Bid form */}
                {selectedModuleIndex === index && (
                  <div className="mt-4 p-4 bg-white rounded border-2 border-black">
                    <h4 className="font-bold mb-2">Place Your Bid</h4>
                    
                    {bidSuccess ? (
                      <div className="mb-4 p-3 bg-green-100 rounded border border-green-500">
                        <p className="text-green-700 font-semibold">Bid submitted successfully!</p>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4">
                          <label className="block font-semibold mb-1">Bid Amount (ETH)</label>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="0.0"
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block font-semibold mb-1">Proposal</label>
                          <textarea
                            value={bidProposal}
                            onChange={(e) => setBidProposal(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            rows={4}
                            placeholder="Describe your approach to this module..."
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={closeBidForm}
                            className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleBidSubmit(index)}
                            disabled={submittingBid}
                            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            {submittingBid ? "Submitting..." : "Submit Bid"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Collaboration Requests Section */}
        <div className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8">
          <h2 className="text-2xl font-bold mb-6">Collaboration Requests</h2>
          
          <div className="space-y-6">
            {project.modules.map((module, index) => (
              module.bids.length > 0 && (
                <div key={index} className="bg-yellow-50 p-6 rounded border-2 border-black">
                  <h3 className="text-xl font-bold mb-4">{module.name} - Bids</h3>
                  
                  <div className="space-y-4">
                    {module.bids.map((bid, bidIndex) => (
                      <div 
                        key={bidIndex}
                        className="bg-white p-4 rounded border border-black"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold">{bid.freelancer}</p>
                          <span className={`px-2 py-1 rounded text-sm ${
                            bid.isApproved ? "bg-green-200" : "bg-yellow-200"
                          }`}>
                            {bid.isApproved ? "Approved" : "Pending"}
                          </span>
                        </div>
                        <p className="text-sm mb-2">Amount: {ethers.formatEther(bid.bidAmount)} ETH</p>
                        <p className="text-sm mb-4">{bid.proposal}</p>
                        
                        {/* Accept bid button for clients */}
                        {isClient && !module.freelancer && !bid.isApproved && (
                          <button
                            onClick={() => handleAcceptBid(index, bidIndex)}
                            disabled={approvingBid}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {approvingBid ? "Approving..." : "Accept Bid"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
            
            {project.modules.every(module => module.bids.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">No collaboration requests yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 