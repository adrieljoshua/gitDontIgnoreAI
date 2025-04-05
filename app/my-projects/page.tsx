'use client';
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractAbi from "../contracts/FreelanceProject.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet, Code, DollarSign, HandCoins, Clock, Briefcase, Users, PlusCircle, ExternalLink, AlertTriangle, FileCode, Server, Database, Globe, Laptop } from "lucide-react";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CONTRACT_ADDRESS = "0x7A0399618B0bde2eeBdcAA4c1C9Da2883D118b3d";

interface Module {
  name: string;
  percentageWeight: number;
  freelancer: string;
  bids?: ModuleBid[];
  isCompleted?: boolean;
  isApproved?: boolean;
}

interface ModuleBid {
  freelancer: string;
  bidAmount: any;
  proposal: string;
  isApproved: boolean;
}

interface Project {
  id: any;
  title: string;
  description: string;
  tagline: string;
  budget: any;
  modules: Module[];
  owner: string;
  githubRepo: string;
  completionPercentage: number;
  ownerUsername: string;
  developerCount: number;
}

interface DeveloperRequest {
  developer: string;
  moduleIndex: number;
  bidAmount: string;
  proposal: string;
}

export default function MyProjects() {
  const router = useRouter();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [developerRequests, setDeveloperRequests] = useState<DeveloperRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Function to safely format strings
  const safeString = (str: any): string => {
    if (typeof str === 'string') return str;
    if (str === null || str === undefined) return '';
    return String(str);
  };

  // Function to format wallet address
  const formatWalletAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Function to safely format ETH values
  const safelyFormatEther = (value: any): string => {
    try {
      if (typeof value === 'bigint' || (typeof value === 'string' && value.trim() !== '')) {
        return parseFloat(ethers.formatEther(value)).toFixed(2);
      }
      return '0.00';
    } catch (error) {
      console.error("Error formatting ether value:", error);
      return '0.00';
    }
  };

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum !== undefined) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setUserAddress(accounts[0]);
        setWalletConnected(true);
        
        // Store in localStorage
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('userAddress', accounts[0]);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // Function to get random project logo
  const getRandomProjectLogo = () => {
    const logos = [
      <FileCode key="code" className="h-8 w-8 text-blue-600" />,
      <Server key="server" className="h-8 w-8 text-purple-600" />,
      <Database key="db" className="h-8 w-8 text-green-600" />,
      <Globe key="globe" className="h-8 w-8 text-cyan-600" />,
      <Laptop key="laptop" className="h-8 w-8 text-red-600" />
    ];
    return logos[Math.floor(Math.random() * logos.length)];
  };

  // Function to extract tagline from description
  const extractTagline = (description: string): string => {
    if (!description) return "No description available";
    // Take first sentence or first 100 characters
    const firstSentence = description.split(/[.!?]/)[0];
    return firstSentence.length > 100 ? firstSentence.substring(0, 97) + '...' : firstSentence;
  };

  // Function to view project details and fetch developer requests
  const viewProjectDetails = async (project: Project) => {
    setSelectedProject(project);
    await fetchDeveloperRequests(project);
  };

  // Function to fetch developer requests for a project
  const fetchDeveloperRequests = async (project: Project) => {
    if (!project) return;
    
    try {
      setRequestsLoading(true);
      
      if (typeof window !== 'undefined' && window.ethereum !== undefined) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.output.abi, signer);
        
        console.log("Fetching latest project data for ID:", project.id);
        
        // Since there's no direct getBids function, we'll need to get the latest project data
        // First try to get the project from the projects list
        const projectList = await contract.listProjectsByClient(userAddress);
        console.log("Projects from blockchain:", projectList);
        
        // Find the matching project
        let updatedProject = null;
        for (const p of projectList) {
          // Check for matching ID - might need to convert format
          if (p.id.toString() === project.id.toString()) {
            updatedProject = p;
            break;
          }
        }
        
        if (!updatedProject) {
          console.log("Project not found in projects list, using current data");
          updatedProject = project;
        } else {
          console.log("Found updated project data:", updatedProject);
        }
        
        // Extract all bids from the modules
        const requests: DeveloperRequest[] = [];
        
        if (updatedProject.modules && Array.isArray(updatedProject.modules)) {
          updatedProject.modules.forEach((module: any, moduleIndex: number) => {
            if (module.bids && Array.isArray(module.bids)) {
              module.bids.forEach((bid: any) => {
                if (!bid.isApproved) {
                  requests.push({
                    developer: bid.freelancer,
                    moduleIndex: moduleIndex,
                    bidAmount: ethers.formatEther(bid.bidAmount),
                    proposal: bid.proposal
                  });
                }
              });
            }
          });
        }
        
        console.log("Developer requests from blockchain data:", requests);
        setDeveloperRequests(requests);
      }
      
      setRequestsLoading(false);
    } catch (error) {
      console.error("Error fetching developer requests:", error);
      setRequestsLoading(false);
    }
  };

  // Function to accept a developer request
  const acceptRequest = async (request: DeveloperRequest) => {
    if (!selectedProject) return;
    
    try {
      if (typeof window !== 'undefined' && window.ethereum !== undefined) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.output.abi, signer);
        
        console.log(`Accepting bid for Project ID: ${selectedProject.id}, Module Index: ${request.moduleIndex}, Developer: ${request.developer}`);
        
        // Get fresh project data to ensure we have the most up-to-date bids
        const projectList = await contract.listProjectsByClient(userAddress);
        
        // Find the matching project
        let updatedProject = null;
        for (const p of projectList) {
          if (p.id.toString() === selectedProject.id.toString()) {
            updatedProject = p;
            break;
          }
        }
        
        if (!updatedProject) {
          console.error("Could not find project in the latest data");
          alert("Error: Could not find project in the latest blockchain data");
          return;
        }
        
        // Get the module to find the bid
        const module = updatedProject.modules[request.moduleIndex];
        if (!module || !module.bids || !Array.isArray(module.bids)) {
          console.error("Module or bids not found");
          alert("Error: Module or bids not found in the latest data");
          return;
        }
        
        // Find the bidIndex that matches the developer's address
        let bidIndex = -1;
        for (let i = 0; i < module.bids.length; i++) {
          if (module.bids[i].freelancer.toLowerCase() === request.developer.toLowerCase()) {
            bidIndex = i;
            break;
          }
        }
        
        if (bidIndex === -1) {
          console.error("Could not find matching bid in module bids array");
          alert("Error: Could not find the bid in the contract data");
          return;
        }
        
        console.log(`Found matching bid at index ${bidIndex}`);
        
        // Call the approveModuleBid function on the contract
        const tx = await contract.approveModuleBid(
          selectedProject.id, 
          request.moduleIndex,
          bidIndex
        );
        
        console.log("Transaction submitted:", tx);
        alert(`Transaction submitted! Hash: ${tx.hash}\nPlease wait for confirmation...`);
        
        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);
        
        // After successful transaction, refresh the data
        alert("Bid has been successfully approved! The developer can now start working on this module.");
        setDeveloperRequests(developerRequests.filter(r => 
          r.developer.toLowerCase() !== request.developer.toLowerCase() || 
          r.moduleIndex !== request.moduleIndex
        ));
        
        // Also refresh the project details to update module status
        await fetchMyProjects();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Error accepting request: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Function to reject a developer request
  const rejectRequest = async (request: DeveloperRequest) => {
    if (!selectedProject) return;
    
    try {
      if (typeof window !== 'undefined' && window.ethereum !== undefined) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.output.abi, signer);
        
        console.log(`Rejecting bid for Project ID: ${selectedProject.id}, Module Index: ${request.moduleIndex}, Developer: ${request.developer}`);
        
        // Get fresh project data
        const projectList = await contract.listProjectsByClient(userAddress);
        
        // Find the matching project
        let updatedProject = null;
        for (const p of projectList) {
          if (p.id.toString() === selectedProject.id.toString()) {
            updatedProject = p;
            break;
          }
        }
        
        if (!updatedProject) {
          console.error("Could not find project in the latest data");
          alert("Error: Could not find project in the latest blockchain data");
          return;
        }
        
        // Get the module to find the bid
        const module = updatedProject.modules[request.moduleIndex];
        if (!module || !module.bids || !Array.isArray(module.bids)) {
          console.error("Module or bids not found");
          alert("Error: Module or bids not found in the latest data");
          return;
        }
        
        // Find the bidIndex that matches the developer's address
        let bidIndex = -1;
        for (let i = 0; i < module.bids.length; i++) {
          if (module.bids[i].freelancer.toLowerCase() === request.developer.toLowerCase()) {
            bidIndex = i;
            break;
          }
        }
        
        if (bidIndex === -1) {
          console.error("Could not find matching bid in module bids array");
          alert("Error: Could not find the bid in the contract data");
          return;
        }
        
        // Call the rejectModuleBid function on the contract
        const tx = await contract.rejectModuleBid(
          selectedProject.id, 
          request.moduleIndex,
          bidIndex
        );
        
        console.log("Transaction submitted:", tx);
        alert(`Transaction submitted! Hash: ${tx.hash}\nPlease wait for confirmation...`);
        
        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);
        
        // After successful transaction, refresh the data
        alert("Bid has been rejected successfully.");
        
        // Remove the rejected request from the list
        setDeveloperRequests(developerRequests.filter(r => 
          r.developer.toLowerCase() !== request.developer.toLowerCase() || 
          r.moduleIndex !== request.moduleIndex
        ));
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Error rejecting request: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Function to fetch user's projects
  const fetchMyProjects = async () => {
    if (!userAddress) return;
    
    try {
      setLoading(true);
      console.log("Fetching projects for address:", userAddress);
      
      if (typeof window !== 'undefined' && window.ethereum !== undefined) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.output.abi, provider);
        
        // Use listProjectsByClient instead of filtering all projects
        // This is more efficient as it only returns projects owned by the user
        const userProjects = await contract.listProjectsByClient(userAddress);
        console.log("Projects from blockchain for client:", userProjects);
        
        // Transform the raw blockchain data into our Project interface
        const enhancedProjects = await Promise.all(userProjects.map(async (project: any, index: number) => {
          console.log(`Processing project ${index}:`, project);
          
          // Extract GitHub username from repo URL
          const repoUrl = project.githubRepo || "https://github.com/username/repo";
          const username = repoUrl.split('/')[3] || "username";
          
          // Get proper references to the client/owner
          const owner = project.client || userAddress;
          
          // Calculate completion percentage based on modules with freelancers
          const modules = Array.isArray(project.modules) ? project.modules : [];
          const assignedModules = modules.filter((m: Module) => 
            m.freelancer && m.freelancer !== "0x0000000000000000000000000000000000000000"
          ).length;
          const totalModules = modules.length;
          const completionPercentage = totalModules > 0 ? 
            Math.round((assignedModules / totalModules) * 100) : 0;
          
          // Extract title or use fallback
          let projectTitle = project.title || "Untitled Project";
          
          // Get tagline from description
          let tagline = "No description available";
          if (project.description) {
            tagline = extractTagline(String(project.description));
          }
          
          return {
            ...project,
            id: project.id ? project.id.toString() : index.toString(),
            title: projectTitle, 
            tagline: tagline,
            owner: owner,
            githubRepo: repoUrl,
            ownerUsername: username,
            completionPercentage,
            developerCount: assignedModules,
            modules: modules,
            budget: project.budget || ethers.parseEther("0")
          };
        }));
        
        console.log("Enhanced user projects:", enhancedProjects);
        setMyProjects(enhancedProjects);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setLoading(false);
    }
  };

  // Check if wallet is connected on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedConnection = localStorage.getItem('walletConnected');
      const storedAddress = localStorage.getItem('userAddress');
      
      if (storedConnection === 'true' && storedAddress) {
        setWalletConnected(true);
        setUserAddress(storedAddress);
      }
    }
  }, []);

  // Fetch projects when wallet connection changes
  useEffect(() => {
    if (walletConnected && userAddress) {
      fetchMyProjects();
    } else {
      setMyProjects([]);
      setLoading(false);
    }
  }, [walletConnected, userAddress]);

  // Project Card Component
  const ProjectCard = ({ project }: { project: Project }) => {
    const projectLogo = getRandomProjectLogo();
    
    return (
      <Card 
        className="bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col transition-all duration-200 hover:translate-y-[-4px] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,0.9)] cursor-pointer"
        onClick={() => router.push(`/projects/${project.id}?owner=true`)}
      >
        <CardHeader className="pb-4 border-b-2 border-black bg-white px-6 pt-5">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-md bg-blue-100 flex items-center justify-center border-2 border-black p-2 shrink-0">
              {projectLogo}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold text-black tracking-tight leading-tight mb-1 break-words">
                {safeString(project.title) || "Untitled Project"}
              </CardTitle>
              <CardDescription className="text-gray-700 font-medium text-sm line-clamp-2">
                {safeString(project.tagline) || 'No description available'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="py-5 px-6 flex-grow space-y-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs font-medium bg-gray-50 px-3 py-2 rounded-md border-2 border-gray-200">
              <HandCoins className="h-4 w-4 text-gray-700 shrink-0" />
              <span className="text-gray-800 font-semibold truncate">{safeString(project.ownerUsername)}</span>
              <span className="text-gray-500 shrink-0">(You)</span>
            </div>
            
            <Badge variant="outline" className="bg-yellow-400 text-black border-2 border-black px-3 py-1 font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
              <DollarSign className="h-3 w-3 mr-1 shrink-0" />
              {safelyFormatEther(project.budget)} ETH
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-black" />
                <span className="text-sm font-bold text-black">{project.developerCount}</span>
              </div>
              <span className="text-xs font-bold text-gray-900">{project.completionPercentage}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 w-full border border-gray-300 overflow-hidden">
              <div 
                className="bg-green-500 rounded-full h-[10px] transition-all duration-500" 
                style={{ width: `${project.completionPercentage}%` }} 
              />
            </div>
          </div>
          
          <div className="pb-1">
            <p className="text-xs font-bold text-gray-700 mb-2">Project Modules:</p>
            <div className="flex flex-wrap gap-2 py-1">
              {project.modules.map((module, i) => (
                <div 
                  key={i} 
                  className={`px-3 py-1.5 rounded-md text-xs font-bold border-2 ${
                    module.freelancer === "0x0000000000000000000000000000000000000000" 
                      ? "bg-blue-100 text-blue-900 border-blue-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]" 
                      : "bg-gray-100 text-gray-500 border-gray-300"
                  }`}
                >
                  {safeString(module.name)}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-3 border-t-2 border-black bg-white p-4">
          <Button 
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click from triggering
              router.push(`/projects/${project.id}?owner=true`);
            }} 
            className="w-full bg-yellow-400 text-black font-bold hover:bg-yellow-500 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 transition-all py-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">Manage Project</span>
              <Briefcase className="h-4 w-4" />
            </div>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fffdf7]">
      <Navbar />
      <main className="flex-1 container py-12 px-4 mx-auto max-w-7xl">
        <section className="relative mb-16">
          <div className="flex flex-col items-center justify-center text-center mb-16">
            <h1 className="text-5xl font-extrabold mb-6 font-prompt text-black drop-shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
              My Projects
            </h1>
            <p className="text-xl text-gray-800 max-w-2xl mx-auto leading-relaxed">
              Manage your created projects and track their progress
            </p>

            {!walletConnected ? (
              <Button 
                onClick={connectWallet} 
                className="mt-10 bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-5 border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.9)] hover:translate-y-1 transition-all flex items-center gap-3 font-bold"
              >
                <Wallet className="h-5 w-5" />
                Connect Wallet to View Your Projects
              </Button>
            ) : (
              <Button 
                className="mt-10 bg-green-500 text-black hover:bg-green-400 px-8 py-5 border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.9)] hover:translate-y-1 transition-all flex items-center gap-3 font-bold"
                asChild
              >
                <Link href="/projects/create">
                  <PlusCircle className="h-5 w-5" />
                  Create New Project
                </Link>
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-black"></div>
            </div>
          ) : !walletConnected ? (
            <Alert className="max-w-2xl mx-auto bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] text-black p-6">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <AlertTitle className="text-lg font-bold mt-2">Wallet not connected</AlertTitle>
              <AlertDescription className="mt-2 text-gray-700">
                Please connect your wallet to view your projects. This will allow us to fetch projects that you own.
              </AlertDescription>
            </Alert>
          ) : myProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Alert className="max-w-2xl mx-auto bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] text-black p-6 mb-8">
                <Briefcase className="h-6 w-6 text-black" />
                <AlertTitle className="text-lg font-bold mt-2">No projects found</AlertTitle>
                <AlertDescription className="mt-2 text-gray-700">
                  You haven't created any projects yet. Start by creating your first project!
                </AlertDescription>
              </Alert>
              
              <Button 
                className="bg-green-500 text-black hover:bg-green-400 px-8 py-5 border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.9)] hover:translate-y-1 transition-all flex items-center gap-3 font-bold"
                asChild
              >
                <Link href="/projects/create">
                  <PlusCircle className="h-5 w-5" />
                  Create Your First Project
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myProjects.map((project, index) => (
                <ProjectCard key={index} project={project} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-4xl">
            <Card className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.9)] max-h-[85vh] overflow-y-auto">
              <CardHeader className="sticky top-0 z-10 bg-white border-b-2 border-black px-6 pt-5 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold text-black tracking-tight">
                      {selectedProject.title}
                    </CardTitle>
                    <CardDescription className="text-gray-700 mt-1">
                      {selectedProject.tagline}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline"
                    className="border-2 border-black rounded-md h-9 w-9 p-0"
                    onClick={() => setSelectedProject(null)}
                  >
                    <span className="sr-only">Close</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-8">
                {/* Project Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-black">Project Details</h3>
                    
                    <div className="bg-gray-50 p-4 rounded-md border-2 border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                      <p className="text-black whitespace-pre-line">
                        {selectedProject.description || "No detailed description provided."}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md border-2 border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">GitHub Repository</h4>
                      <div className="flex items-center justify-between">
                        <p className="text-black font-medium break-all">
                          {selectedProject.githubRepo}
                        </p>
                        <Button 
                          onClick={() => window.open(selectedProject.githubRepo, '_blank')}
                          className="ml-2 bg-black text-white px-3 py-1 text-xs rounded-md"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md border-2 border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Budget</h4>
                      <p className="text-black font-bold">
                        {safelyFormatEther(selectedProject.budget)} ETH
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-black">Modules</h3>
                    
                    <div className="bg-gray-50 p-4 rounded-md border-2 border-gray-200 max-h-[200px] overflow-y-auto">
                      <ul className="space-y-2">
                        {selectedProject.modules.map((module, i) => (
                          <li key={i} className="p-2 bg-white rounded-md border border-gray-300">
                            <div className="flex justify-between">
                              <span className="font-semibold">{module.name}</span>
                              <Badge className={`${
                                module.freelancer === "0x0000000000000000000000000000000000000000" 
                                  ? "bg-blue-100 text-blue-900 border-blue-300" 
                                  : "bg-green-100 text-green-900 border-green-300"
                              } text-xs border py-1 px-2`}>
                                {module.freelancer === "0x0000000000000000000000000000000000000000" 
                                  ? "Available" 
                                  : "Assigned"}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              Weight: {module.percentageWeight}%
                            </div>
                            {module.freelancer !== "0x0000000000000000000000000000000000000000" && (
                              <div className="mt-2 text-xs text-gray-600">
                                Freelancer: {formatWalletAddress(module.freelancer)}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md border-2 border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Project Progress</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Completion</span>
                          <span className="font-bold">{selectedProject.completionPercentage}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-3 w-full border border-gray-300 overflow-hidden">
                          <div 
                            className="bg-green-500 rounded-full h-[10px] transition-all duration-500" 
                            style={{ width: `${selectedProject.completionPercentage}%` }} 
                          />
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          {selectedProject.developerCount} developer{selectedProject.developerCount !== 1 ? 's' : ''} working on this project
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Developer Requests Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-black flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Developer Requests
                    <Badge className="ml-2 bg-yellow-400 text-black border-2 border-black px-2 py-0.5 text-xs">
                      Owner Only
                    </Badge>
                  </h3>
                  
                  {requestsLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
                    </div>
                  ) : developerRequests.length === 0 ? (
                    <Alert className="bg-gray-50 border-2 border-gray-200">
                      <Clock className="h-4 w-4 text-gray-700" />
                      <AlertTitle className="text-sm font-semibold mt-0">No requests yet</AlertTitle>
                      <AlertDescription className="text-xs text-gray-600">
                        No developers have requested to work on your project modules yet.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {developerRequests.map((request, i) => (
                        <Card key={i} className="border-2 border-gray-200 shadow-sm">
                          <CardHeader className="pb-2 pt-4 px-5">
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle className="text-md font-bold">
                                  Request for Module #{request.moduleIndex + 1}
                                </CardTitle>
                                <CardDescription>
                                  {selectedProject.modules[request.moduleIndex]?.name}
                                </CardDescription>
                              </div>
                              <Badge className="bg-green-50 text-green-800 border border-green-200 px-2 py-1 font-medium">
                                {request.bidAmount} ETH
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="px-5 py-3">
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-3">
                              <p className="text-sm text-gray-800">
                                <span className="font-medium">Developer:</span> {formatWalletAddress(request.developer)}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-700 mb-1">Proposal</h4>
                              <p className="text-sm text-black">{request.proposal}</p>
                            </div>
                          </CardContent>
                          <CardFooter className="px-5 py-3 flex gap-3">
                            <Button 
                              onClick={() => acceptRequest(request)}
                              className="flex-1 bg-green-500 text-white hover:bg-green-600 border-2 border-green-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-1 transition-all"
                            >
                              Accept Request
                            </Button>
                            <Button 
                              onClick={() => rejectRequest(request)}
                              variant="outline"
                              className="flex-1 bg-white text-red-600 hover:bg-red-50 border-2 border-red-200 hover:border-red-300"
                            >
                              Reject
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="bg-white border-t-2 border-black p-5 flex justify-end">
                <Button 
                  onClick={() => setSelectedProject(null)}
                  variant="outline"
                  className="border-2 border-black text-black hover:bg-gray-100 px-6 py-2 text-sm font-bold"
                >
                  Close
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 