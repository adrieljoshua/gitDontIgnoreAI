'use client';
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractAbi from "../contracts/FreelanceProject.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet, Code, ChevronsUpDown, CheckCircle2, Clock, DollarSign, Briefcase, Users, BarChart, Layers, PieChart, Database, FileCode, Server, Cpu, Package } from "lucide-react";
import Navbar from "@/components/navbar";

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
  owner: string;
  githubRepo: string;
  completionPercentage: number;
  ownerUsername: string;
  developerCount: number;
}

export default function OngoingProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (typeof window !== 'undefined' && window.ethereum !== undefined) {
        try {
          console.log("Starting to fetch blockchain projects...");
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.output.abi, provider);
        
          setLoading(true);
          const result = await contract.listOngoingProjects();
          
          console.log("Raw blockchain response:", result);
          // Examine direct structure of response
          console.log("Result type:", typeof result);
          console.log("Is Array?", Array.isArray(result));
          
          // Check first project structure if available
          if (result && result.length > 0) {
            // Create a function to safely stringify BigInt values
            const replacer = (key: string, value: any) => {
              if (typeof value === 'bigint') {
                return value.toString();
              }
              return value;
            };
            
            console.log("First project keys:", Object.keys(result[0]));
            
            try {
              // Handle BigInt serialization
              console.log("First project details (safe logging):");
              Object.keys(result[0]).forEach(key => {
                const value = result[0][key];
                if (typeof value === 'bigint') {
                  console.log(`  ${key}: ${value.toString()} (BigInt)`);
                } else if (value === null) {
                  console.log(`  ${key}: null`);
                } else if (typeof value === 'object' && value !== null) {
                  console.log(`  ${key}: (object/array)`);
                  if (Array.isArray(value)) {
                    console.log(`    Array with ${value.length} items`);
                    if (value.length > 0) {
                      console.log(`    First item keys: ${Object.keys(value[0]).join(', ')}`);
                    }
                  } else {
                    console.log(`    Object keys: ${Object.keys(value).join(', ')}`);
                  }
                } else {
                  console.log(`  ${key}: ${value}`);
                }
              });
            } catch (error) {
              console.error("Error logging project details:", error);
            }
            
            // Direct access of known properties to avoid serialization issues
            const project = result[0];
            console.log("Raw project[0] title property:", project.title);
            console.log("Raw project[0] name property:", project.name);
            console.log("Raw project[0] projectTitle property:", project.projectTitle);
            console.log("Raw project[0] projectName property:", project.projectName);
            
            // Check project[0] data structure for debugging
            console.log("Is project[0] an array?", Array.isArray(project));
            console.log("project[0] typeof:", typeof project);
            
            // Check numeric properties that might be related to title
            console.log("project[0] id:", typeof project.id === 'bigint' ? project.id.toString() : project.id);
            console.log("project[0] index:", typeof project.index === 'bigint' ? project.index.toString() : project.index);
            
            // If project is an array or object with numeric indices, inspect them
            if (typeof project === 'object' && project !== null) {
              // Look for numbered properties (e.g., '0', '1', etc.) that might contain title
              for (let i = 0; i < 5; i++) {
                if (project[i] !== undefined) {
                  console.log(`project[0][${i}]:`, 
                    typeof project[i] === 'bigint' ? project[i].toString() : 
                    typeof project[i] === 'object' ? '(object)' : project[i]);
                }
              }
              
              // Check specific properties that blockchain contracts often use
              if (project._title !== undefined) console.log("project[0]._title:", project._title);
              if (project._name !== undefined) console.log("project[0]._name:", project._name);
            }
          }
          
          // Enhance project data with additional details
          const enhancedProjects = await Promise.all(result.map(async (project: any, index: number) => {
            console.log(`Processing project ${index}...`);
            
            // Extract GitHub username from repo URL (normally would come from contract)
            const repoUrl = project.githubRepo || "https://github.com/username/repo";
            const username = repoUrl.split('/')[3] || "username";
            
            // Log the project structure more safely
            console.log(`Project ${index} raw structure:`);
            if (typeof project === 'object' && project !== null) {
              // Check direct properties first
              console.log(`- Direct properties: ${Object.keys(project).join(', ')}`);
              
              // Check if the project is an array-like object with numeric indices
              if (typeof project[0] !== 'undefined') {
                console.log(`- Appears to have array-like structure with item at index 0`);
                // Try to extract title from the first item if it exists
                const potentialTitle = 
                  project[0]?.title || 
                  project[0]?.name || 
                  project[0]?.projectName || 
                  project[0];
                console.log(`- First item potential title: ${potentialTitle}`);
              }
              
              // Try to identify where the title might be stored
              ['title', 'name', 'projectName', 'projectTitle', '_title', '_name'].forEach(key => {
                const value = project[key];
                if (value !== undefined) {
                  console.log(`- Found property '${key}': ${value}`);
                }
              });
              
              // Check numeric indices explicitly
              for (let i = 0; i < 5; i++) {
                if (project[i] !== undefined) {
                  const value = project[i];
                  console.log(`- Found value at index ${i}: ${
                    typeof value === 'object' ? '(object)' : 
                    typeof value === 'bigint' ? value.toString() : value
                  }`);
                }
              }
            }
            
            // Try different strategies to extract title
            // 1. Traditional object property
            let projectTitle = project.title || project.name || project.projectName || project.projectTitle;
            
            // 2. Check if it's stored in a numeric index (common in some contract return values)
            if (!projectTitle && typeof project[0] === 'string') {
              projectTitle = project[0];
              console.log(`Project ${index} title extracted from index 0: '${projectTitle}'`);
            } else if (!projectTitle && typeof project[1] === 'string') {
              projectTitle = project[1];
              console.log(`Project ${index} title extracted from index 1: '${projectTitle}'`);
            }
            
            // 3. Fallback
            if (!projectTitle) {
              projectTitle = `Project ${index + 1}`;
              console.log(`Project ${index} title not found, using fallback: '${projectTitle}'`);
            } else {
              console.log(`Project ${index} title extracted: '${projectTitle}'`);
            }
            
            // Handle integer mapping for title if necessary
            const projectTitleStr = typeof projectTitle === 'number' || typeof projectTitle === 'bigint' ? 
              `Project ${projectTitle.toString()}` : String(projectTitle);
            
            // Calculate completion percentage based on modules with freelancers
            const modules = Array.isArray(project.modules) ? project.modules : [];
            const assignedModules = modules.filter((m: Module) => 
              m.freelancer && m.freelancer !== "0x0000000000000000000000000000000000000000"
            ).length;
            const totalModules = modules.length;
            const completionPercentage = totalModules > 0 ? 
              Math.round((assignedModules / totalModules) * 100) : 0;
            
            const enhancedProject = {
              ...project,
              title: projectTitleStr, // Ensure title is set properly as string
              owner: project.owner || "0x1234567890123456789012345678901234567890", // Default if not available
              githubRepo: repoUrl,
              ownerUsername: username,
              completionPercentage,
              developerCount: assignedModules,
              // Ensure modules is always an array
              modules: modules,
              // Ensure budget is valid
              budget: project.budget || ethers.parseEther("0")
            };
            
            console.log(`Enhanced project ${index} title:`, enhancedProject.title);
            return enhancedProject;
          }));
          
          console.log("Enhanced projects:", enhancedProjects);
          setProjects(enhancedProjects);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching projects:", error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  async function placeBid() {
    if (!signer) {
      alert("Please connect your wallet");
      return;
    }

    if (!bidAmount || bidAmount.trim() === "") {
      alert("Please enter a valid bid amount");
      return;
    }

    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.output.abi, signer);
    try {
      if (selectedProject) {
        if (!selectedProject.id) {
          throw new Error("Invalid project ID");
        }
        
        let parsedBidAmount;
        try {
          parsedBidAmount = ethers.parseEther(bidAmount);
        } catch (error) {
          alert("Please enter a valid ETH amount");
          return;
        }

        const tx = await contract.bidForModule(selectedProject.id, moduleIndex, parsedBidAmount, proposal);
        await tx.wait();
        alert("Bid placed successfully!");
        setSelectedProject(null);
      } else {
        alert("No project selected.");
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Failed to place bid: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  }

  async function connectWallet() {
    if (typeof window !== 'undefined' && window.ethereum !== undefined) {
      try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setSigner(signer);
        setWalletConnected(true);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask");
    }
  }

  // Helper to safely handle null/undefined values
  const safeString = (value: any) => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const extractTagline = (description: string) => {
    if (!description) return "";
    const firstSentence = description.split('.')[0];
    return firstSentence.length > 80 ? firstSentence.substring(0, 80) + '...' : firstSentence;
  };

  const safelyFormatEther = (value: any) => {
    if (!value || value === null) return "0";
    try {
      return ethers.formatEther(value);
    } catch (error) {
      console.error("Error formatting ether value:", error);
      return "0";
    }
  };

  // Helper to get a random project logo icon
  const getRandomProjectLogo = () => {
    const logos = [
      <FileCode className="h-6 w-6 text-purple-600" />,
      <Server className="h-6 w-6 text-blue-600" />,
      <Database className="h-6 w-6 text-green-600" />,
      <Layers className="h-6 w-6 text-yellow-600" />,
      <Cpu className="h-6 w-6 text-red-600" />,
      <PieChart className="h-6 w-6 text-indigo-600" />,
      <BarChart className="h-6 w-6 text-pink-600" />,
      <Package className="h-6 w-6 text-orange-600" />
    ];
    // Use deterministic selection based on project title if available
    return logos[Math.floor(Math.random() * logos.length)];
  };

  const ProjectCard = ({ project, onBid }: { project: Project, onBid: (project: Project) => void }) => {
    const projectLogo = getRandomProjectLogo();
    
    return (
      <Card className="bg-white border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col transition-all duration-200 hover:translate-y-[-4px] hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,0.9)]">
        <CardHeader className="pb-4 border-b-2 border-black bg-white px-6 pt-5">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-md bg-yellow-100 flex items-center justify-center border-2 border-black p-2 shrink-0">
              {projectLogo}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold text-black tracking-tight leading-tight mb-1 break-words">
                {safeString(project.title) || "Untitled Project"}
              </CardTitle>
              <CardDescription className="text-gray-700 font-medium text-sm line-clamp-2">
                {extractTagline(safeString(project.description) || 'No description available')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="py-5 px-6 flex-grow space-y-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs font-medium bg-gray-50 px-3 py-2 rounded-md border-2 border-gray-200">
              <Code className="h-4 w-4 text-gray-700 shrink-0" />
              <span className="text-gray-800 font-semibold truncate">{safeString(project.ownerUsername)}</span>
              <span className="text-gray-500 shrink-0">({formatWalletAddress(project.owner)})</span>
            </div>
            
            <Badge variant="outline" className="bg-yellow-100 text-black border-2 border-yellow-300 px-3 py-1 font-semibold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
              <DollarSign className="h-3 w-3 mr-1 shrink-0" />
              {safelyFormatEther(project.budget)} ETH
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-700">Completion</span>
              <span className="text-xs font-bold text-gray-900">{project.completionPercentage}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 w-full border border-gray-300 overflow-hidden">
              <div 
                className="bg-green-500 rounded-full h-[10px] transition-all duration-500" 
                style={{ width: `${project.completionPercentage}%` }} 
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-blue-50 p-3 border-2 border-blue-200 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-1.5 border-2 border-blue-300">
                <Users className="h-4 w-4 text-blue-700" />
              </div>
              <span className="text-sm font-bold text-blue-900">{project.developerCount} developer{project.developerCount !== 1 ? 's' : ''}</span>
            </div>
            <span className="text-sm font-medium bg-white px-2 py-1 rounded-md border-2 border-gray-200 text-gray-700">{project.modules.length} module{project.modules.length !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="overflow-x-auto pb-1">
            <p className="text-xs font-bold text-gray-700 mb-2">Available modules:</p>
            <div className="flex gap-2 py-1">
              {project.modules.map((module, i) => (
                <div 
                  key={i} 
                  className={`min-w-fit px-3 py-1.5 rounded-md text-xs font-bold border-2 ${
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
            onClick={() => onBid(project)} 
            className="w-full bg-yellow-400 text-black font-bold hover:bg-yellow-500 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 transition-all py-3"
            disabled={!walletConnected}
          >
            Bid on Project
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
            <h1 className="text-5xl font-extrabold mb-6 font-prompt text-black drop-shadow-[3px_3px_0px_rgba(0,0,0,0.8)]">
              Find Projects
            </h1>
            <p className="text-xl text-gray-800 max-w-2xl mx-auto leading-relaxed">
              Browse available projects and bid on modules that match your skills
            </p>

            {!walletConnected && (
              <Button 
                onClick={connectWallet} 
                className="mt-10 bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-5 border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.9)] hover:translate-y-1 transition-all flex items-center gap-3 font-bold"
              >
                <Wallet className="h-5 w-5" />
                Connect Wallet
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-black"></div>
            </div>
          ) : projects.length === 0 ? (
            <Alert className="max-w-2xl mx-auto bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)] text-black p-6">
              <Clock className="h-6 w-6 text-black" />
              <AlertTitle className="text-lg font-bold mt-2">No projects available</AlertTitle>
              <AlertDescription className="mt-2 text-gray-700">
                There are currently no ongoing projects. Check back later or create your own project.
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-3 max-w-md mx-auto mb-10 bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.9)]">
                <TabsTrigger value="all" className="text-black data-[state=active]:bg-yellow-400 data-[state=active]:text-black border-r-2 border-black py-3 font-semibold">All Projects</TabsTrigger>
                <TabsTrigger value="new" className="text-black data-[state=active]:bg-yellow-400 data-[state=active]:text-black border-r-2 border-black py-3 font-semibold">New</TabsTrigger>
                <TabsTrigger value="popular" className="text-black data-[state=active]:bg-yellow-400 data-[state=active]:text-black py-3 font-semibold">Popular</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {projects.map((project, index) => (
                    <ProjectCard key={index} project={project} onBid={setSelectedProject} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="new" className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {projects.slice(0, 3).map((project, index) => (
                    <ProjectCard key={index} project={project} onBid={setSelectedProject} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="popular" className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...projects].sort((a, b) => Number(b.budget) - Number(a.budget)).map((project, index) => (
                    <ProjectCard key={index} project={project} onBid={setSelectedProject} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </section>

      {selectedProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.9)]">
              <CardHeader className="border-b-2 border-black bg-white px-6 py-5">
                <CardTitle className="text-black text-xl font-bold tracking-tight">Bid on {selectedProject.title}</CardTitle>
                <CardDescription className="text-gray-700 mt-2">
                  Choose a module and submit your proposal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 py-6 px-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-black">Select Module:</label>
                  <select 
                    className="w-full bg-white border-2 border-black rounded-none p-3 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                    value={moduleIndex}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setModuleIndex(parseInt(e.target.value))}
                  >
                    {selectedProject.modules.map((module, index) => (
                      module.freelancer === "0x0000000000000000000000000000000000000000" && (
                        <option key={index} value={index}>
                          {module.name} ({module.percentageWeight}%)
                        </option>
                      )
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-black">Bid Amount (ETH):</label>
                  <Input
                    type="text"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="bg-white border-2 border-black rounded-none text-black p-3 h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                    placeholder="0.1"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-black">Your Proposal:</label>
                  <Textarea
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                    className="bg-white border-2 border-black rounded-none text-black min-h-[150px] p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                    placeholder="Describe your experience and how you would approach this module..."
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t-2 border-black bg-white p-5 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedProject(null)}
                  className="border-2 border-black text-black hover:text-black hover:bg-gray-100 py-3 px-5"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={placeBid}
                  className="bg-yellow-400 text-black hover:bg-yellow-500 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 transition-all py-3 px-6 flex-1 font-bold"
                  disabled={!bidAmount.trim() || !proposal.trim()}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Submit Bid
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>

      <footer className="w-full py-10 bg-black text-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-yellow-400">DevCollab</span>
            </div>
            <p className="text-sm text-white">© 2025 DevCollab. All rights reserved.</p>
            <div className="flex items-center gap-8">
              <a href="/terms" className="text-sm text-white hover:text-yellow-400 transition-colors">Terms</a>
              <a href="/privacy" className="text-sm text-white hover:text-yellow-400 transition-colors">Privacy</a>
              <a href="/contact" className="text-sm text-white hover:text-yellow-400 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}