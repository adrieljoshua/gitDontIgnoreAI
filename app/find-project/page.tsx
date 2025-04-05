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
import { Wallet, Code, ChevronsUpDown, CheckCircle2, Clock, DollarSign, Briefcase } from "lucide-react";
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
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.output.abi, provider);
        
          setLoading(true);
          const result = await contract.listOngoingProjects();
          setProjects(result);
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

    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.output.abi, signer);
    try {
      if (selectedProject) {
        const tx = await contract.bidForModule(selectedProject.id, moduleIndex, ethers.parseEther(bidAmount), proposal);
        await tx.wait();
        alert("Bid placed successfully!");
        setSelectedProject(null);
      } else {
        alert("No project selected.");
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Failed to place bid");
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

  return (
    <div className="flex min-h-screen flex-col bg-yellow-50">
      <Navbar />
      <main className="flex-1 container py-8">
        <section className="relative mb-12">
          <div className="flex flex-col items-center justify-center text-center mb-16">
            <h1 className="text-5xl font-extrabold mb-4 font-prompt text-black drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              Find Projects
            </h1>
            <p className="text-xl text-black max-w-2xl mx-auto">
              Browse available projects and bid on modules that match your skills
            </p>

            {!walletConnected && (
              <Button 
                onClick={connectWallet} 
                className="mt-8 bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2"
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
            <Alert className="max-w-2xl mx-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
              <Clock className="h-5 w-5 text-black" />
              <AlertTitle>No projects available</AlertTitle>
              <AlertDescription>
                There are currently no ongoing projects. Check back later or create your own project.
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-3 max-w-md mx-auto mb-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <TabsTrigger value="all" className="text-black data-[state=active]:bg-yellow-500 data-[state=active]:text-black border-r-2 border-black">All Projects</TabsTrigger>
                <TabsTrigger value="new" className="text-black data-[state=active]:bg-yellow-500 data-[state=active]:text-black border-r-2 border-black">New</TabsTrigger>
                <TabsTrigger value="popular" className="text-black data-[state=active]:bg-yellow-500 data-[state=active]:text-black">Popular</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
                    <Card key={index} className="bg-white border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col hover:translate-y-1 transition-all duration-200">
                      <CardHeader className="pb-2 border-b-2 border-black">
                        <CardTitle className="text-black text-xl">{project.title}</CardTitle>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="bg-yellow-200 text-black border border-black">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {ethers.formatEther(project.budget)} ETH
                          </Badge>
                          <Badge variant="outline" className="ml-2 bg-blue-200 text-black border border-black">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {project.modules.length} Modules
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3 flex-grow">
                        <p className="text-black text-sm line-clamp-3 mb-3">{project.description}</p>
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-black flex items-center">
                            <Code className="h-4 w-4 mr-1 text-black" />
                            Available Modules:
                          </h4>
                          <ul className="space-y-1 text-sm text-black">
                            {project.modules.slice(0, 3).map((module, modIndex) => (
                              module.freelancer === "0x0000000000000000000000000000000000000000" && (
                                <li key={modIndex} className="flex justify-between items-center">
                                  <span>{module.name}</span>
                                  <span className="text-xs font-bold">{module.percentageWeight}%</span>
                                </li>
                              )
                            ))}
                            {project.modules.filter(m => m.freelancer === "0x0000000000000000000000000000000000000000").length > 3 && (
                              <li className="text-xs text-black">
                                +{project.modules.filter(m => m.freelancer === "0x0000000000000000000000000000000000000000").length - 3} more modules
                              </li>
                            )}
                          </ul>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 border-t-2 border-black">
                        <Button 
                          onClick={() => setSelectedProject(project)} 
                          className="w-full bg-yellow-400 text-black hover:bg-yellow-500 border border-black"
                          disabled={!walletConnected}
                        >
                          Bid on Project
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="new" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.slice(0, 3).map((project, index) => (
                    <Card key={index} className="bg-white border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col hover:translate-y-1 transition-all duration-200">
                      <CardHeader className="pb-2 border-b-2 border-black">
                        <CardTitle className="text-black text-xl">{project.title}</CardTitle>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="bg-yellow-200 text-black border border-black">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {ethers.formatEther(project.budget)} ETH
                          </Badge>
                          <Badge variant="outline" className="ml-2 bg-blue-200 text-black border border-black">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {project.modules.length} Modules
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3 flex-grow">
                        <p className="text-black text-sm line-clamp-3 mb-3">{project.description}</p>
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-black flex items-center">
                            <Code className="h-4 w-4 mr-1 text-black" />
                            Available Modules:
                          </h4>
                          <ul className="space-y-1 text-sm text-black">
                            {project.modules.slice(0, 3).map((module, modIndex) => (
                              module.freelancer === "0x0000000000000000000000000000000000000000" && (
                                <li key={modIndex} className="flex justify-between items-center">
                                  <span>{module.name}</span>
                                  <span className="text-xs font-bold">{module.percentageWeight}%</span>
                </li>
                              )
              ))}
            </ul>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 border-t-2 border-black">
                        <Button 
                          onClick={() => setSelectedProject(project)} 
                          className="w-full bg-yellow-400 text-black hover:bg-yellow-500 border border-black"
                          disabled={!walletConnected}
                        >
                          Bid on Project
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="popular" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...projects].sort((a, b) => Number(b.budget) - Number(a.budget)).map((project, index) => (
                    <Card key={index} className="bg-white border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col hover:translate-y-1 transition-all duration-200">
                      <CardHeader className="pb-2 border-b-2 border-black">
                        <CardTitle className="text-black text-xl">{project.title}</CardTitle>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="bg-yellow-200 text-black border border-black">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {ethers.formatEther(project.budget)} ETH
                          </Badge>
                          <Badge variant="outline" className="ml-2 bg-blue-200 text-black border border-black">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {project.modules.length} Modules
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3 flex-grow">
                        <p className="text-black text-sm line-clamp-3 mb-3">{project.description}</p>
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-black flex items-center">
                            <Code className="h-4 w-4 mr-1 text-black" />
                            Available Modules:
                          </h4>
                          <ul className="space-y-1 text-sm text-black">
                            {project.modules.slice(0, 3).map((module, modIndex) => (
                              module.freelancer === "0x0000000000000000000000000000000000000000" && (
                                <li key={modIndex} className="flex justify-between items-center">
                                  <span>{module.name}</span>
                                  <span className="text-xs font-bold">{module.percentageWeight}%</span>
          </li>
                              )
        ))}
      </ul>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 border-t-2 border-black">
                        <Button 
                          onClick={() => setSelectedProject(project)} 
                          className="w-full bg-yellow-400 text-black hover:bg-yellow-500 border border-black"
                          disabled={!walletConnected}
                        >
                          Bid on Project
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </section>

      {selectedProject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="border-b-4 border-black">
                <CardTitle className="text-black">Bid on {selectedProject.title}</CardTitle>
                <CardDescription className="text-black">
                  Choose a module and submit your proposal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Select Module:</label>
                  <select 
                    className="w-full bg-white border-2 border-black rounded-none p-2 text-black"
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
                  <label className="text-sm font-medium text-black">Bid Amount (ETH):</label>
                  <Input
            type="text"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
                    className="bg-white border-2 border-black rounded-none text-black"
                    placeholder="0.1"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Your Proposal:</label>
                  <Textarea
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
                    className="bg-white border-2 border-black rounded-none text-black min-h-[120px]"
                    placeholder="Describe your experience and how you would approach this module..."
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t-4 border-black">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedProject(null)}
                  className="border-2 border-black text-black hover:text-black hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={placeBid}
                  className="bg-yellow-500 text-black hover:bg-yellow-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all"
                  disabled={!bidAmount.trim() || !proposal.trim()}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Bid
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>

      <footer className="w-full py-8 bg-black text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-yellow-500">DevCollab</span>
            </div>
            <p className="text-sm text-white">© 2025 DevCollab. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="/terms" className="text-sm text-white hover:text-yellow-500 transition-colors">Terms</a>
              <a href="/privacy" className="text-sm text-white hover:text-yellow-500 transition-colors">Privacy</a>
              <a href="/contact" className="text-sm text-white hover:text-yellow-500 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}