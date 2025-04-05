"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import { signIn, signOut, useSession } from "next-auth/react"
import { ethers } from "ethers"
import FreelanceProject from "../contracts/FreelanceProject.json"

declare global {
  interface Window {
    ethereum?: any;
  }
}

const PROJECT_CONTRACT = "0x7A0399618B0bde2eeBdcAA4c1C9Da2883D118b3d"
const { abi } = FreelanceProject.output

interface Module {
  weightage: number;
  module: string;
  selected: boolean;
  submodules: Submodule[];
}

interface Submodule {
  title: string;
  description: string;
  selected: boolean;
}

type Question = {
  id: number
  question: string
  answer: string
}

export default function ChatPage() {
  const { data: session } = useSession()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [modules, setModules] = useState<Module[]>([])
  const [modulesParsed, setModulesParsed] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  
  // Individual state variables for each answer
  const [projectType, setProjectType] = useState("")
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [projectFunding, setProjectFunding] = useState("")
  const [finalConfirmation, setFinalConfirmation] = useState("")

  const [questions, setQuestions] = useState<Question[]>([
    { id: 0, question: "GitHub Authorization", answer: "" },
    { id: 1, question: "What are we gonna build today?", answer: "" },
    { id: 2, question: "What is our project called?", answer: "" },
    { id: 3, question: "Describe all the features and components you want in your project", answer: "" },
    { id: 4, question: "How much will you be funding for the project?", answer: "" },
    { id: 5, question: "Confirm Project Details", answer: "" }
  ])

  useEffect(() => {
    const parseModules = async () => {
      if (projectDescription && !modulesParsed) {
        try {
          const response = await fetch("/api/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              tagline: projectType,
              description: projectDescription 
            }),
          });

          const data = await response.json();
          if (data.response) {
            const cleanedResponse = data.response.replace(/^```json\n|```$/g, "");
            const parsedData = JSON.parse(cleanedResponse);

            const initialModules = parsedData.map((mod: any) => ({
              ...mod,
              selected: true,
              submodules: mod.submodules.map((sub: any) => ({
                ...sub,
                selected: true,
              })),
            }));

            setModules(initialModules);
            setModulesParsed(true);
          }
        } catch (error) {
          console.error("Error parsing response:", error);
          setModules([]);
        }
      }
    };

    parseModules();
  }, [projectDescription, modulesParsed, projectType]);

  const handleNext = async () => {
    if (currentQuestionIndex === 0 && !session) {
      alert("Please sign in with GitHub to continue.");
      return;
    }

    if (currentQuestionIndex > 0 && !input.trim()) {
      alert("Please provide an answer before proceeding.");
      return;
    }

    // For final confirmation card
    if (currentQuestionIndex === 5 && input.toLowerCase() !== 'confirm') {
      // Remove the confirm requirement
      // alert("Please type 'confirm' to proceed with repository creation.");
      // return;
    }

    setIsFlipping(true);
    
    // Save current answer
    if (currentQuestionIndex > 0) {
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex].answer = input;
      setQuestions(updatedQuestions);
  
      // Update individual state variables based on current question
      switch(currentQuestionIndex) {
        case 1:
          setProjectType(input);
          break;
        case 2:
          setProjectName(input);
          break;
        case 3:
          setProjectDescription(input);
          break;
        case 4:
          setProjectFunding(input);
          break;
        case 5:
          setFinalConfirmation(input);
          break;
      }
    }
    
    // Clear input for next question
    setInput("");
    
    // Move to next question after animation completes
    setTimeout(() => {
      setCurrentQuestionIndex(prev => Math.min(prev + 1, questions.length - 1));
      setIsFlipping(false);
    }, 300);
  };

  const handleBack = () => {
    if (currentQuestionIndex === 0) return;
    
    setIsFlipping(true);
    
    // Save current answer
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answer = input;
    setQuestions(updatedQuestions);
    
    // Set input to previous question's answer
    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev - 1);
      setInput(questions[currentQuestionIndex - 1].answer);
      setIsFlipping(false);
    }, 300);
  };

  const toggleModule = useCallback((mIndex: number) => {
    setModules((prev) =>
      prev.map((mod, index) =>
        index === mIndex
          ? {
              ...mod,
              selected: !mod.selected,
              submodules: mod.submodules.map((sub) => ({
                ...sub,
                selected: !mod.selected,
              })),
            }
          : mod
      )
    );
  }, []);

  const toggleSubmodule = useCallback((mIndex: number, sIndex: number) => {
    setModules((prev) =>
      prev.map((mod, index) =>
        index === mIndex
          ? {
              ...mod,
              submodules: mod.submodules.map((sub, subIndex) =>
                subIndex === sIndex ? { ...sub, selected: !sub.selected } : sub
              ),
              selected: mod.submodules.every((sub, subIndex) =>
                subIndex === sIndex ? !sub.selected : sub.selected
              ),
            }
          : mod
      )
    );
  }, []);

  const selectedModules = useMemo(
    () =>
      modules
        .filter((mod) => mod.selected)
        .map((mod) => ({
          module: mod.module,
          submodules: mod.submodules.filter((sub) => sub.selected),
        })),
    [modules]
  );

  async function registerProjectOnChain(githubRepo: string) {
    if (!window.ethereum) {
      alert("MetaMask is required to register the project.");
      return;
    }
  
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(PROJECT_CONTRACT, abi, signer);
  
      const selectedModules = modules.filter(mod => mod.selected);
      const moduleNames = selectedModules.map(mod => mod.module);
      const moduleWeights = selectedModules.map(mod => mod.weightage);
      const submoduleNames = selectedModules.map(mod => 
        mod.submodules.filter(sub => sub.selected).map(sub => sub.title)
      );
  
      const tx = await contract.registerProject(
        projectName,
        projectDescription,
        ethers.parseEther(projectFunding),
        githubRepo,
        moduleNames,
        moduleWeights,
        submoduleNames
      );
  
      await tx.wait();
      console.log("Project and modules registered on-chain:", tx);
      
      return true;
    } catch (error) {
      console.error("Blockchain error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown blockchain error";
      alert(`Repository created but blockchain registration failed: ${errorMessage}`);
      return false;
    }
  }

  async function createRepo() {
    if (!session) {
      alert("Please sign in with GitHub first.");
      return;
    }
  
    if (!projectName.trim()) {
      alert("Repository name is required.");
      return;
    }
  
    setIsLoading(true);
  
    try {
      // Validate repository name
      const validRepoName = projectName.replace(/[^a-zA-Z0-9-_]/g, "-");
      if (validRepoName !== projectName) {
        console.log(`Repository name sanitized from "${projectName}" to "${validRepoName}"`);
      }
      
      const projectData = {
        tagline: projectType,
        description: projectDescription,
        modules: selectedModules,
      };
  
      const projectMarkdown = await fetch("/api/create-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      }).then((res) => res.json());
  
      const payload = {
        repoName: validRepoName,
        readmeContent: projectMarkdown.response,
        selectedModules,
      };

      console.log("Creating repository with payload:", payload);

      const repoRes = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!repoRes.ok) {
        // Try to get detailed error message
        let errorMsg = "Repository creation failed";
        try {
          const errorData = await repoRes.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorMsg);
      }
      
      const repoData = await repoRes.json();
      console.log("Repository creation response:", repoData);
      
      if (!repoData.success) {
        throw new Error(repoData.error || "Repository creation failed");
      }
  
      try {
        await registerProjectOnChain(repoData.repoUrl);
        alert(`Repository '${validRepoName}' created and registered successfully!`);
      } catch (error) {
        console.error("Blockchain error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown blockchain error";
        alert(`Repository created but blockchain registration failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error during repository creation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert("Failed to create repository: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const renderCardContent = (index: number) => {
    if (index === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-lg font-bold mb-4">Please sign in with GitHub to continue</p>
          <Button
            className="bg-black text-white border-4 border-black px-6 py-3 text-lg font-bold hover:bg-gray-800 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            onClick={() => signIn("github")}
            disabled={!!session}
          >
            {session ? "Signed in ✓" : "Sign in with GitHub"}
          </Button>
          {session && (
            <p className="text-green-600 mt-2 font-bold">Signed in as {session.user?.name}</p>
          )}
        </div>
      );
    } else if (index === 5) {
      // Final confirmation card
      return (
        <div className="flex flex-col h-full">
          <h3 className="text-xl font-black mb-2 text-black">PROJECT SUMMARY</h3>
          <div className="overflow-y-auto mb-4 p-3 border-4 border-black bg-white">
            <p className="mb-2"><span className="font-bold">Project Type:</span> {projectType}</p>
            <p className="mb-2"><span className="font-bold">Project Name:</span> {projectName}</p>
            <p className="mb-2"><span className="font-bold">Funding:</span> {projectFunding}</p>
            <p className="mb-2"><span className="font-bold">Description:</span> {projectDescription}</p>
          </div>
          
          <div className="overflow-y-auto flex-grow border-4 border-black bg-white p-4 mb-4">
            <h4 className="text-lg font-black mb-2 text-black">PROJECT MODULES</h4>
            
            {modules.length > 0 ? (
              <div>
                {modules.map((mod, mIndex) => (
                  <div key={mIndex} className="mb-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mod.selected}
                        onChange={() => toggleModule(mIndex)}
                        className="w-5 h-5 border-2 border-black mr-3"
                      />
                      <span className="text-lg font-bold">{mod.module}</span>
                      <span className="ml-2 text-sm bg-yellow-400 px-2 py-1 rounded-full border-2 border-black">
                        Weight: {mod.weightage}
                      </span>
                    </label>
                    
                    <div className="ml-8 mt-2">
                      {mod.submodules.map((sub, sIndex) => (
                        <div key={sIndex} className="mb-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sub.selected}
                              onChange={() => toggleSubmodule(mIndex, sIndex)}
                              className="w-4 h-4 border-2 border-black mr-2"
                            />
                            <span className="font-semibold">{sub.title}</span>
                          </label>
                          <p className="ml-6 text-sm">{sub.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="flex justify-center space-x-2 mb-4">
                  <div className="h-4 w-4 rounded-full bg-black animate-bounce"></div>
                  <div className="h-4 w-4 rounded-full bg-black animate-bounce delay-100"></div>
                  <div className="h-4 w-4 rounded-full bg-black animate-bounce delay-200"></div>
                </div>
                <p className="font-bold">Computing project modules...</p>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Regular question cards
      return (
        <div className="flex flex-col h-full">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Your answer...`}
            className="w-full flex-grow p-4 bg-white border-4 border-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            disabled={isLoading}
            rows={6}
          />
        </div>
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-8 bg-yellow-100">
        <div className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col items-center justify-center">
          <div className="relative w-full h-full perspective-1000">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={`absolute w-full h-full 
                  ${index === currentQuestionIndex ? 'z-10' : 'z-0'} 
                  ${isFlipping ? 'transition-all duration-300 ease-in-out' : ''}
                  ${isFlipping && index === currentQuestionIndex ? 'transform rotate-y-90' : ''}
                  ${index !== currentQuestionIndex ? 'transform rotate-y-180 opacity-0' : 'rotate-y-0 opacity-100'}
                `}
                style={{ 
                  transformStyle: 'preserve-3d', 
                  backfaceVisibility: 'hidden',
                  transformOrigin: 'center center'
                }}
              >
                <Card className="w-full max-w-2xl h-auto mx-auto flex flex-col bg-yellow-300 border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                  <CardHeader className="bg-yellow-400 text-black border-b-8 border-black py-6">
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">
                      {q.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow p-6 bg-yellow-200">
                    {renderCardContent(index)}
                  </CardContent>
                  <CardFooter className="border-t-8 border-black p-6 flex justify-between bg-yellow-400">
                    <Button
                      onClick={handleBack}
                      disabled={currentQuestionIndex === 0 || isFlipping || isLoading}
                      className="bg-white text-black border-4 border-black px-6 py-2 text-xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      BACK
                    </Button>
                    {index === 5 ? (
                      <Button
                        onClick={createRepo}
                        disabled={!session || isLoading || modules.length === 0}
                        className="bg-green-500 text-white border-4 border-black px-6 py-2 text-xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        CREATE PROJECT
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={
                          (currentQuestionIndex === 0 && !session) || 
                          isFlipping || 
                          isLoading || 
                          (currentQuestionIndex > 0 && currentQuestionIndex < 5 && !input.trim())
                        }
                        className="bg-black text-white border-4 border-black px-6 py-2 text-xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        NEXT
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
          
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg border-4 border-black">
                <div className="flex space-x-2">
                  <div className="h-4 w-4 rounded-full bg-black animate-bounce"></div>
                  <div className="h-4 w-4 rounded-full bg-black animate-bounce delay-100"></div>
                  <div className="h-4 w-4 rounded-full bg-black animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}