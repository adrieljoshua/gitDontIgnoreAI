"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Navbar from "@/components/navbar"
import { signIn, signOut, useSession } from "next-auth/react"
import { ethers } from "ethers"
import FreelanceProject from "../contracts/FreelanceProject.json"
import { CheckCircle2, Check } from "lucide-react"
import { useRouter } from "next/navigation"

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

// Add Tailwind CSS utilities for 3D transformations
const rotateY = (degrees: number) => `rotateY(${degrees}deg)`;

export default function ChatPage() {
  const router = useRouter();
  const { data: session } = useSession()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [modules, setModules] = useState<Module[]>([])
  const [modulesParsed, setModulesParsed] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [repoUrl, setRepoUrl] = useState("")
  const [fetchingModules, setFetchingModules] = useState(false)
  
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

  // Track whether we're flipping forward (next) or backward (back)
  const [flipDirection, setFlipDirection] = useState<'next' | 'back'>('next');

  useEffect(() => {
    const parseModules = async () => {
      if (projectDescription && !modulesParsed) {
        try {
          setFetchingModules(true);
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
        } finally {
          setFetchingModules(false);
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

    if (currentQuestionIndex > 0 && currentQuestionIndex < 5 && !input.trim()) {
      alert("Please provide an answer before proceeding.");
      return;
    }

    setFlipDirection('next');
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
          // Final confirmation - proceed with repository creation
          if (session && modules.length > 0) {
            await createRepo();
          }
          break;
      }
    }
    
    // Clear input for next question
    setInput("");
    
    // Move to next question after animation completes
    setTimeout(() => {
      setCurrentQuestionIndex(prev => Math.min(prev + 1, questions.length - 1));
      setIsFlipping(false);
    }, 600);
  };

  const handleBack = () => {
    if (currentQuestionIndex === 0) return;
    
    setFlipDirection('back');
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
    }, 600);
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
      alert("Failed to register project on-chain");
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
        repoName: projectName,
        readmeContent: projectMarkdown.response,
        selectedModules,
      };

      const repoRes = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
  
      const repoData = await repoRes.json();
      if (!repoData.success) {
        alert("Error creating repository: " + repoData.error);
        setIsLoading(false);
        return;
      }
  
      await registerProjectOnChain(repoData.repoUrl);
      
      // Show success state and set repo URL for linking
      setRepoUrl(repoData.repoUrl);
      setIsLoading(false);
      setShowSuccess(true);
      
      // Redirect to my-projects after 3 seconds
      setTimeout(() => {
        router.push('/my-projects');
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong.");
      setIsLoading(false);
    }
  }

  const renderCardContent = (index: number) => {
    if (index === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
          <div className="bg-[#F3F9FF] p-6 border-4 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
            <p className="text-xl font-black mb-4 text-center">Sign in with GitHub to start creating your project</p>
            <Button
              className="w-full bg-black text-white border-4 border-black px-6 py-3 text-lg font-black hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              onClick={() => signIn("github")}
              disabled={!!session}
            >
              {session ? "SIGNED IN ✓" : "SIGN IN WITH GITHUB"}
            </Button>
          </div>
          {session && (
            <div className="bg-[#E9F5E1] p-4 border-4 border-black rounded-lg transform -rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-green-800 font-black text-center">Signed in as {session.user?.name}</p>
            </div>
          )}
        </div>
      );
    } else if (index === 5) {
      return (
        <div className="flex flex-col h-full gap-8" >
          <h3 className="text-xl font-black mb-2 text-black">PROJECT SUMMARY</h3>
          <div className="overflow-y-auto mb-2 p-6 border-4 border-black bg-[#F3F9FF] rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-1" style={{
      overflowX: 'auto',
      scrollbarWidth: 'none',        // Firefox
      msOverflowStyle: 'none'        // IE/Edge
    }}>
            <p className="mb-1 text-sm"><span className="font-black">Project Type:</span> {projectType}</p>
            <p className="mb-1 text-sm"><span className="font-black">Project Name:</span> {projectName}</p>
            <p className="mb-1 text-sm"><span className="font-black">Funding:</span> {projectFunding} cUSD</p>
            <p className="mb-1 text-sm"><span className="font-black">Description:</span> {projectDescription}</p>
          </div>
          
          {fetchingModules && (
            <div className="overflow-y-auto mb-2 p-3 border-4 border-black bg-[#FFE8E8] rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 flex items-center justify-center">
              <div className="flex flex-col items-center p-3">
                <div className="flex space-x-2 mb-3">
                  <div className="h-3 w-3 rounded-full bg-black animate-bounce"></div>
                  <div className="h-3 w-3 rounded-full bg-black animate-bounce delay-100"></div>
                  <div className="h-3 w-3 rounded-full bg-black animate-bounce delay-200"></div>
                </div>
                <p className="text-sm font-black">FETCHING PROJECT MODULES FROM AI...</p>
              </div>
            </div>
          )}
          
          {modules.length > 0 && (
            <div className="overflow-y-auto mb-2 p-6 h-full border-4 border-black bg-[#E9F5E1] rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 max-h-[250px]" style={{
                  overflowX: 'auto',
                  scrollbarWidth: 'none',        // Firefox
                  msOverflowStyle: 'none'        // IE/Edge
                }}>
              <h4 className="font-black mb-1 text-sm">SELECTED MODULES:</h4>
              <ul className="list-disc pl-5">
                {modules.filter(mod => mod.selected).map((mod, idx) => (
                  <li key={idx} className="mb-1 text-xs font-medium">{mod.module}</li>
                ))}
              </ul>
            </div>
          )}
          
          {!fetchingModules && modules.length === 0 && (
            <div className="overflow-y-auto mb-2 p-3 border-4 border-black bg-[#FFE8E8] rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 flex items-center justify-center">
              <p className="text-sm font-black text-center">NO MODULES GENERATED. PLEASE GO BACK AND PROVIDE A MORE DETAILED PROJECT DESCRIPTION.</p>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex flex-col h-full">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full flex-grow p-6 bg-white border-4 border-black rounded-lg text-lg font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            disabled={isLoading}
            rows={8}
          />
          <div className="mt-4 text-center">
            <div className="inline-block bg-[#FFF5D1] px-4 py-2 border-2 border-black rounded-full transform -rotate-2">
              <p className="text-sm font-black text-black">
                {index === 1 && "What type of project are you building?"}
                {index === 2 && "Choose a memorable name!"}
                {index === 3 && "Describe in detail what features you need"}
                {index === 4 && "How much cUSD are you willing to fund?"}
              </p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1 container py-8">
        
        <div className="w-full max-w-4xl mx-auto h-[85vh] flex flex-col items-center justify-center">
          {showSuccess ? (
            <div className="animation-slide-up">
              <Card className="w-full max-w-2xl h-[500px] mx-auto flex flex-col rounded-xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <CardHeader className="bg-green-400 text-black border-b-8 border-black py-8">
                  <CardTitle className="text-3xl font-black tracking-tight uppercase text-center">
                    Success!
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center p-8 bg-white">
                  <div className="animation-scale-in bg-green-400 w-32 h-32 rounded-full flex items-center justify-center border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 animation-spin-in">
                    <Check className="w-20 h-20 text-black animation-check" strokeWidth={4} />
                  </div>
                  <h2 className="text-2xl font-black text-black mb-4 text-center animation-fade-in-1">
                    GitHub Repository Created!
                  </h2>
                  <p className="text-lg font-medium text-center mb-6 animation-fade-in-2">
                    Your project has been successfully registered on the blockchain.
                  </p>
                  <div className="bg-gray-100 py-3 px-6 rounded-lg border-2 border-black animation-fade-in-3 transform rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-sm font-medium">
                      Redirecting to My Projects in a moment...
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="border-t-8 border-black p-6 flex justify-center bg-green-400">
                  <Button
                    onClick={() => router.push('/getworkdone')}
                    className="bg-black text-white border-4 border-black px-8 py-3 text-xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    GO TO MY PROJECTS
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="relative w-full h-full" style={{ perspective: "2000px" }}>
              {questions.map((q, index) => {
                // Determine which animation to apply based on card position and flip direction
                let animationClass = "";
                
                if (index === currentQuestionIndex) {
                  // Current card
                  if (isFlipping) {
                    // When flipping, rotate current card out
                    animationClass = flipDirection === 'next' 
                      ? "animate-flip-out-right" 
                      : "animate-flip-out-left";
                  } else {
                    // When not flipping, current card is visible
                    animationClass = "rotate-y-0";
                  }
                } else if (index === currentQuestionIndex + 1 && flipDirection === 'next' && isFlipping) {
                  // Next card coming in
                  animationClass = "animate-flip-in-right";
                } else if (index === currentQuestionIndex - 1 && flipDirection === 'back' && isFlipping) {
                  // Previous card coming in
                  animationClass = "animate-flip-in-left";
                } else {
                  // All other cards are flipped away
                  animationClass = index < currentQuestionIndex 
                    ? "rotate-y--180" // Cards before current are flipped left
                    : "rotate-y-180";  // Cards after current are flipped right
                }
                
                return (
                  <div
                    key={q.id}
                    className={`absolute w-full h-full ${animationClass} 
                      ${(index === currentQuestionIndex || 
                        (index === currentQuestionIndex + 1 && isFlipping && flipDirection === 'next') ||
                        (index === currentQuestionIndex - 1 && isFlipping && flipDirection === 'back')) 
                        ? 'z-10' : 'z-0 pointer-events-none'}
                      ${index !== currentQuestionIndex && !isFlipping ? 'opacity-0' : 'opacity-100'}
                    `}
                    style={{ 
                      transformStyle: 'preserve-3d', 
                      backfaceVisibility: 'hidden',
                      transform: animationClass.includes('animate') ? undefined : rotateY(animationClass === 'rotate-y-0' ? 0 : animationClass === 'rotate-y--180' ? -180 : 180),
                      transition: isFlipping ? 'none' : 'all 0.6s ease-in-out'
                    }}
                  >      
                    <Card className="w-full max-w-2xl h-[650px] mx-auto flex flex-col rounded-xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                      <CardHeader className="bg-yellow-300 text-black border-b-8 border-black py-8">
                        <CardTitle className="text-3xl font-black tracking-tight uppercase text-center">
                          {q.question}
                        </CardTitle>
                        <div className="absolute top-4 right-4 bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                          {index + 1}/{questions.length}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow p-8 bg-white relative overflow-y-auto">
                        {renderCardContent(index)}
                        <div className="absolute inset-0 border-4 border-dashed border-gray-200 m-2 pointer-events-none rounded-xl"></div>
                      </CardContent>
                      <CardFooter className="border-t-8 border-black p-6 flex justify-between bg-yellow-300">
                        <Button
                          onClick={handleBack}
                          disabled={currentQuestionIndex === 0 || isFlipping || isLoading}
                          className="bg-white text-black border-4 border-black px-6 py-3 text-xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                        >
                          BACK
                        </Button>
                        <Button
                          onClick={handleNext}
                          disabled={
                            (currentQuestionIndex === 0 && !session) || 
                            isFlipping || 
                            isLoading || 
                            (currentQuestionIndex > 0 && currentQuestionIndex < 5 && !input.trim()) ||
                            (currentQuestionIndex === 5 && fetchingModules) || 
                            (currentQuestionIndex === 5 && modules.length === 0)
                          }
                          className="bg-black text-white border-4 border-black px-6 py-3 text-xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                        >
                          {currentQuestionIndex === 5 ? "CREATE PROJECT" : "NEXT"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
          
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex space-x-4">
                  <div className="h-6 w-6 rounded-full bg-black animate-bounce"></div>
                  <div className="h-6 w-6 rounded-full bg-black animate-bounce delay-100"></div>
                  <div className="h-6 w-6 rounded-full bg-black animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <style jsx global>{`
        @keyframes flipOutRight {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(-180deg); }
        }
        
        @keyframes flipOutLeft {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(180deg); }
        }
        
        @keyframes flipInRight {
          from { transform: rotateY(180deg); }
          to { transform: rotateY(0deg); }
        }
        
        @keyframes flipInLeft {
          from { transform: rotateY(-180deg); }
          to { transform: rotateY(0deg); }
        }
        
        @keyframes slideUp {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes scaleIn {
          0% { transform: scale(0); }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @keyframes spinIn {
          0% { transform: rotate(-180deg) scale(0); }
          70% { transform: rotate(30deg) scale(1.1); }
          100% { transform: rotate(0) scale(1); }
        }
        
        @keyframes drawCheck {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animation-slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }
        
        .animation-scale-in {
          animation: scaleIn 0.8s ease-out forwards;
        }
        
        .animation-spin-in {
          animation: spinIn 0.8s ease-out forwards;
        }
        
        .animation-check {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawCheck 0.8s ease-out 0.4s forwards;
        }
        
        .animation-fade-in-1 {
          opacity: 0;
          animation: fadeIn 0.6s ease-out 0.6s forwards;
        }
        
        .animation-fade-in-2 {
          opacity: 0;
          animation: fadeIn 0.6s ease-out 0.8s forwards;
        }
        
        .animation-fade-in-3 {
          opacity: 0;
          animation: fadeIn 0.6s ease-out 1s forwards;
        }
        
        .animate-flip-out-right {
          animation: flipOutRight 0.6s ease-in-out forwards;
          transform-style: preserve-3d;
        }
        
        .animate-flip-out-left {
          animation: flipOutLeft 0.6s ease-in-out forwards;
          transform-style: preserve-3d;
        }
        
        .animate-flip-in-right {
          animation: flipInRight 0.6s ease-in-out forwards;
          transform-style: preserve-3d;
        }
        
        .animate-flip-in-left {
          animation: flipInLeft 0.6s ease-in-out forwards;
          transform-style: preserve-3d;
        }
        
        .rotate-y-0 {
          transform: rotateY(0deg);
        }
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        
        .rotate-y--180 {
          transform: rotateY(-180deg);
        }
      `}</style>
    </div>
  )
}