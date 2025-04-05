'use client';
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractAbi from "../contracts/FreelanceProject.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  isClientProject?: boolean; // Added to identify if the user is the client
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
  const [activeTab, setActiveTab] = useState("all");
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

  // Function to safely format cUSD values
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
        
        // Fetch projects where user is the client
        const clientProjects = await contract.listProjectsByClient(userAddress);
        console.log("Client projects from blockchain:", clientProjects);
        
        // Fetch projects where user is a freelancer
        const freelancerProjects = await contract.listProjectsForFreelancer(userAddress);
        console.log("Freelancer projects from blockchain:", freelancerProjects);
        
        // Transform client projects
        const enhancedClientProjects = await Promise.all(clientProjects.map(async (project: any, index: number) => {
          console.log(`Processing client project ${index}:`, project);
          
          // Process project details
          const enhancedProject = await processProjectData(project, index, true);
          return enhancedProject;
        }));
        
        // Transform freelancer projects
        const enhancedFreelancerProjects = await Promise.all(freelancerProjects.map(async (project: any, index: number) => {
          console.log(`Processing freelancer project ${index}:`, project);
          
          // Process project details
          const enhancedProject = await processProjectData(project, index, false);
          return enhancedProject;
        }));
        
        // Combine all projects
        const allProjects = [...enhancedClientProjects, ...enhancedFreelancerProjects];
        console.log("All user projects:", allProjects);
        setMyProjects(allProjects);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setLoading(false);
    }
  };
  
  // Helper function to process project data
  const processProjectData = async (project: any, index: number, isClientProject: boolean) => {
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
      budget: project.budget || ethers.parseEther("0"),
      isClientProject: isClientProject
    };
  };

  // Check wallet connection on page load
  useEffect(() => {
    // Check localStorage for wallet connection
      const storedConnection = localStorage.getItem('walletConnected');
      const storedAddress = localStorage.getItem('userAddress');
      
      if (storedConnection === 'true' && storedAddress) {
      setUserAddress(storedAddress);
        setWalletConnected(true);
      
      // Verify the connection is still valid
      if (typeof window !== 'undefined' && window.ethereum !== undefined) {
        window.ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts.length === 0 || accounts[0].toLowerCase() !== storedAddress.toLowerCase()) {
              // Connection is no longer valid
              localStorage.removeItem('walletConnected');
              localStorage.removeItem('userAddress');
              setWalletConnected(false);
              setUserAddress(null);
    }
          })
          .catch((error: any) => {
            console.error("Error checking wallet connection:", error);
          });
      }
    }
    
    // Set up event listeners for wallet events
    if (typeof window !== 'undefined' && window.ethereum !== undefined) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('userAddress');
          setWalletConnected(false);
          setUserAddress(null);
        } else if (accounts[0] !== userAddress) {
          // User switched accounts
          localStorage.setItem('userAddress', accounts[0]);
          setUserAddress(accounts[0]);
        }
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [userAddress]);
  
  // Fetch projects when user address changes
  useEffect(() => {
    if (userAddress) {
      fetchMyProjects();
    }
  }, [userAddress]);

  // Project card component
  const ProjectCard = ({ project }: { project: Project }) => {
    const projectLogo = getRandomProjectLogo();
    const projectType = project.isClientProject ? "Owner" : "Contributor";
    const projectId = project.id?.toString();
    
    return (
      <div className="relative">
        {/* Simple direct link for the entire card */}
        <a 
          href={projectId ? `/projects/${projectId}` : "#"} 
          className="block no-underline text-inherit"
        >
          <Card 
            className="bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col transition-all duration-200 hover:translate-y-[-4px] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,0.9)] cursor-pointer"
          >
            <CardHeader className="pb-4 border-b-2 border-black bg-white px-6 pt-5">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-md bg-yellow-100 flex items-center justify-center border-2 border-black p-2 shrink-0">
                  {projectLogo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                  <CardTitle className="text-xl font-bold text-black tracking-tight leading-tight mb-1 break-words">
                    {safeString(project.title) || "Untitled Project"}
                  </CardTitle>
                    <Badge variant="outline" className={`${project.isClientProject ? "bg-green-100 text-green-800 border-green-300" : "bg-blue-100 text-blue-800 border-blue-300"} text-xs px-2 py-1 rounded-md font-medium border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]`}>
                      {projectType}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-700 font-medium text-sm line-clamp-2">
                    {project.tagline || 'No description available'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="py-5 px-6 flex-grow space-y-5 pb-16">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-medium bg-gray-50 px-3 py-2 rounded-md border-2 border-gray-200">
                  <HandCoins className="h-4 w-4 text-gray-700 shrink-0" />
                  <span className="text-gray-800 font-semibold truncate">{safeString(project.ownerUsername)}</span>
                  <span className="text-gray-500 shrink-0">({formatWalletAddress(project.owner)})</span>
                </div>
                
                <Badge variant="outline" className="bg-yellow-100 text-black border-2 border-yellow-300 px-3 py-1 font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                  <DollarSign className="h-3 w-3 mr-1 shrink-0" />
                  {safelyFormatEther(project.budget)} cUSD
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
          </Card>
        </a>
        
        {/* Absolute positioned button that's outside the anchor tag */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              if (projectId) {
                window.location.href = `/projects/${projectId}`;
              } else {
                console.error("Invalid project ID:", project.id);
              }
            }}
            className="w-full bg-yellow-400 text-black font-bold hover:bg-yellow-500 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 transition-all py-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{project.isClientProject ? "Manage Project" : "View Project"}</span>
              {project.isClientProject ? <Briefcase className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
            </div>
          </Button>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="flex min-h-screen flex-col bg-[#fffdf7]">
      <Navbar />
      
      <main className="flex-1 container py-12 px-4 mx-auto max-w-7xl">
        <section className="relative mb-16">
          <div className="flex flex-col items-center justify-center text-center mb-16">
            <h1 className="text-5xl font-extrabold mb-6 font-prompt text-black drop-shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
              Your Projects
            </h1>
            <p className="text-xl text-gray-800 max-w-2xl mx-auto leading-relaxed">
              Manage your owned and contributed projects
            </p>
          </div>

        {!walletConnected ? (
          <div className="py-12">
            <Alert className="max-w-2xl mx-auto bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] text-black p-6">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <AlertTitle className="text-lg font-bold mt-2">Wallet Connection Required</AlertTitle>
              <AlertDescription className="mt-2 text-gray-700">
                Connect your wallet to view your projects.
              </AlertDescription>
              <Button 
                className="mt-6 bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-5 border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.9)] hover:translate-y-1 transition-all flex items-center gap-3 font-bold"
                onClick={connectWallet}
              >
                <Wallet className="h-5 w-5" /> Connect Wallet
              </Button>
            </Alert>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-black"></div>
          </div>
          ) : myProjects.length === 0 ? (
          <Alert className="max-w-2xl mx-auto bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] text-black p-6">
            <AlertTriangle className="h-6 w-6 text-blue-600" />
            <AlertTitle className="text-lg font-bold mt-2">No Projects Found</AlertTitle>
                <AlertDescription className="mt-2 text-gray-700">
              You don't have any projects yet. Create a new project or explore the community.
                </AlertDescription>
            <div className="flex gap-3 mt-6">
              <Button 
                className="bg-yellow-500 text-black hover:bg-yellow-400 px-6 py-3 border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.9)] hover:translate-y-1 transition-all flex items-center gap-3 font-bold"
                onClick={() => router.push('/project-creation')}
              >
                <PlusCircle className="h-5 w-5" /> Create Project
              </Button>
              <Button 
                variant="outline"
                className="px-6 py-3 border-2 border-black bg-white text-black hover:bg-gray-50 flex items-center gap-2 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.9)] hover:translate-y-1 transition-all font-bold"
                onClick={() => router.push('/find-project')}
              >
                <Globe className="h-5 w-5" /> Explore Projects
              </Button>
            </div>
          </Alert>
        ) : (
                  <div>
            <Tabs defaultValue="all" className="w-full">
              <div className="flex justify-center">
                <TabsList className="flex gap-4 mb-6 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]">
                  <TabsTrigger 
                    value="all" 
                    onClick={() => setActiveTab("all")}
                    className="px-4 py-2 text-sm font-medium text-gray-700 data-[state=active]:text-black data-[state=active]:bg-yellow-500 rounded transition-colors"
                  >
                    All Projects ({myProjects.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="owned" 
                    onClick={() => setActiveTab("owned")}
                    className="px-4 py-2 text-sm font-medium text-gray-700 data-[state=active]:text-black data-[state=active]:bg-yellow-500 rounded transition-colors"
                  >
                    Owned Projects ({myProjects.filter(p => p.isClientProject).length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="contributing" 
                    onClick={() => setActiveTab("contributing")}
                    className="px-4 py-2 text-sm font-medium text-gray-700 data-[state=active]:text-black data-[state=active]:bg-yellow-500 rounded transition-colors"
                  >
                    Contributing ({myProjects.filter(p => !p.isClientProject).length})
                  </TabsTrigger>
                </TabsList>
                </div>
              
              <TabsContent value="all" className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {myProjects.map((project, index) => (
                    <ProjectCard key={`all-${index}`} project={project} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="owned" className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {myProjects.filter(p => p.isClientProject).map((project, index) => (
                    <ProjectCard key={`owned-${index}`} project={project} />
                      ))}
                </div>
              </TabsContent>
              
              <TabsContent value="contributing" className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {myProjects.filter(p => !p.isClientProject).map((project, index) => (
                    <ProjectCard key={`contrib-${index}`} project={project} />
                  ))}
          </div>
              </TabsContent>
            </Tabs>
        </div>
      )}
        </section>
      </main>
    </div>
  );
} 