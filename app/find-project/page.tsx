'use client';
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractAbi from "../contracts/FreelanceProject.json";

const CONTRACT_ADDRESS = "0x7A0399618B0bde2eeBdcAA4c1C9Da2883D118b3d";

interface Module {
  name: string;
  percentageWeight: number;
  freelancer: string;
}

interface Project {
  id: any;
  title: string;
  description: string;
  budget: any;
  modules: Module[];
}

export default function OngoingProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Get the user's address
        try {
          const accounts = await provider.send("eth_requestAccounts", []);
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);
          }
        } catch (error) {
          console.error("Error getting user address:", error);
        }
        
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.output.abi, provider);
        
        try {
          const result = await contract.listOngoingProjects();
          setProjects(result);
        } catch (error) {
          console.error("Error fetching projects:", error);
        }
      }
      setLoading(false);
    }
    fetchProjects();
  }, []);

  async function placeBid() {
    if (!signer) {
      alert("Please connect your wallet");
      return;
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.output.abi, signer);
    try {
      if (selectedProject) {
        const tx = await contract.bidForModule(selectedProject.id, moduleIndex, ethers.parseEther(bidAmount), proposal);
        await tx.wait();
        alert("Bid placed successfully!");
        setSelectedProject(null);
        setBidAmount("");
        setProposal("");
      } else {
        alert("No project selected.");
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Failed to place bid");
    }
  }

  async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
      try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setSigner(signer);
        
        // Get the connected address
        const address = await signer.getAddress();
        setUserAddress(address);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        alert("Failed to connect wallet");
      }
    } else {
      alert("Please install MetaMask");
    }
  }

  // Helper function to truncate long text
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  // Helper function to format wallet address
  const formatWalletAddress = (address: string) => {
    if (!address) return "Unassigned";
    if (address === '0x0000000000000000000000000000000000000000') return "Unassigned";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
    
    return (
    <div className="min-h-screen bg-[#fffdf7] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 bg-white p-6 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-5xl font-extrabold font-prompt text-black drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
            Find Projects
            {/* <span className="ml-3 inline-block -rotate-3 bg-yellow-300 text-sm px-3 py-1 rounded-lg border-2 border-black">Neo Brutal</span> */}
          </h1>
          <button 
            onClick={connectWallet}
            className="px-6 py-3 bg-black text-white rounded-md border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:translate-x-1 font-bold transition-all"
          >
            {signer ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span>Connected: {userAddress?.substring(0, 6)}...</span>
            </div>
            ) : (
              <span>Connect Wallet</span>
            )}
          </button>
            </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-xl font-bold">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 mx-auto mb-4 text-gray-400"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
            <p className="text-xl font-bold">No ongoing projects found</p>
            <p className="text-gray-500 mt-2">Check back later or refresh the page</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {projects.map((project, projectIndex) => (
              <div 
                key={projectIndex} 
                className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-6 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{project.title}</h2>
                  <div className="bg-yellow-300 px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] font-bold text-sm">
                    {ethers.formatEther(project.budget)} cUSD
            </div>
          </div>
          
                <div className="bg-gray-100 p-4 rounded-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] mb-4">
                  <p className="text-gray-800">{truncateText(project.description)}</p>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-bold mb-2 text-lg border-b-2 border-black pb-1">Modules</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {project.modules.map((module, modIndex) => (
                      <div key={modIndex} className="bg-blue-50 p-3 rounded-md border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold">{module.name}</h4>
                          <span className="text-sm font-medium">{module.percentageWeight}%</span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">
                          Freelancer: <span className="font-mono">{formatWalletAddress(module.freelancer)}</span>
                        </p>
                        
                        <button 
                          onClick={() => {
                            setSelectedProject(project);
                            setModuleIndex(modIndex);
                          }}
                          className="w-full px-3 py-1 bg-black text-white rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] transition-all text-sm font-bold"
                        >
                          Bid for This Module
                        </button>
      </div>
    ))}
  </div>
</div>
              </div>
            ))}
          </div>
        )}

        {/* Bid Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-6 max-w-md w-full relative">
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-2 right-2 text-black hover:text-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                
              <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">
                Bid for Module
              </h2>
              
              <div className="mb-4">
                <p className="font-bold">Project: <span className="font-normal">{selectedProject.title}</span></p>
                <p className="font-bold">Module: <span className="font-normal">{selectedProject.modules[moduleIndex]?.name || `Module #${moduleIndex}`}</span></p>
                </div>
              
              <div className="space-y-4">
                {/* <div>
                  <label className="block font-bold mb-1">Module Index:</label>
                  <input
                    type="number"
                    value={moduleIndex}
                    onChange={(e) => setModuleIndex(parseInt(e.target.value))}
                    className="w-full p-2 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
                  />
                </div>
                 */}
                <div>
                  <label className="block font-bold mb-1">Bid Amount (cUSD):</label>
                  <input
                    type="text"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full p-2 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block font-bold mb-1">Proposal:</label>
                  <textarea
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                    className="w-full p-2 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] min-h-[100px]"
                    placeholder="Describe your experience and how you'll complete this module..."
                  />
                </div>
              
                <div className="flex justify-between pt-2">
                  <button 
                  onClick={() => setSelectedProject(null)}
                    className="px-4 py-2 bg-white text-black rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] transition-all font-bold"
                >
                  Cancel
                  </button>
                  <button 
                  onClick={placeBid}
                    className="px-4 py-2 bg-green-500 text-white rounded border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] transition-all font-bold"
                >
                  Submit Bid
                  </button>
          </div>
            </div>
            </div>
          </div>
        )}
        </div>
    </div>
  );
}