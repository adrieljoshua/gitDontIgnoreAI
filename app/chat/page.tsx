"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Send } from "lucide-react"
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
  
  // Individual state variables for each answer
  const [projectType, setProjectType] = useState("")
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [projectFunding, setProjectFunding] = useState("")
  const [finalConfirmation, setFinalConfirmation] = useState("")

  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, question: "What are we gonna build today?", answer: "" },
    { id: 2, question: "What is our project called?", answer: "" },
    { id: 3, question: "Kindly provide a detailed comprehensive description of all the features and components that you want in your project like modules and submodules?", answer: "" },
    { id: 4, question: "How much will you be funding for the project?", answer: "" },
    { id: 5, question: "Final confirmation message.", answer: "" }
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    
    // Update both the questions array and individual state variables
    const updatedQuestions = [...questions]
    updatedQuestions[currentQuestionIndex].answer = input
    setQuestions(updatedQuestions)

    // Update individual state variables based on current question
    switch(currentQuestionIndex) {
      case 0:
        setProjectType(input)
        break
      case 1:
        setProjectName(input)
        break
      case 2:
        setProjectDescription(input)
        break
      case 3:
        setProjectFunding(input)
        break
      case 4:
        setFinalConfirmation(input)
        if (session) {
          await createRepo()
        }
        break
    }
    
    setInput("")
    setIsLoading(false)

    // Move to next question if available
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

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
        return;
      }
  
      await registerProjectOnChain(repoData.repoUrl);
      
      alert(`Repository '${projectName}' created and registered successfully!`);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const showNextQuestion = currentQuestionIndex < questions.length - 1

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1 container py-8">
        <Card className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col bg-white border-gray-200">
          <CardHeader className="bg-gray-50 text-dark-900 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2">
              <span className="text-yellow-500">Project</span> Questionnaire
            </CardTitle>
            {!session ? (
              <Button
                className="bg-blue-500 text-white"
                onClick={() => signIn("github")}
              >
                Sign in with GitHub
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-dark-900">Signed in as {session.user?.name}</span>
                <Button
                  className="bg-red-500 text-white"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className={`space-y-2 ${index > currentQuestionIndex ? 'hidden' : ''}`}>
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-dark-900 border border-gray-200">
                    <p>{q.question}</p>
                  </div>
                </div>
                {q.answer && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg p-3 bg-yellow-500 text-black">
                      <p>{q.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {modules.length > 0 && (
              <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-dark-900 font-semibold mb-2">Project Modules</h3>
                <ul className="space-y-2">
                  {modules.map((mod, mIndex) => (
                    <li key={mIndex} className="text-dark-900">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={mod.selected}
                          onChange={() => toggleModule(mIndex)}
                          className="mr-2"
                        />
                        {mod.module}
                      </label>
                      <ul className="ml-6 mt-2 space-y-1">
                        {mod.submodules.map((sub, sIndex) => (
                          <li key={sIndex}>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={sub.selected}
                                onChange={() => toggleSubmodule(mIndex, sIndex)}
                                className="mr-2"
                              />
                              <span className="font-medium">{sub.title}</span>: {sub.description}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-dark-900 border border-gray-200">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse delay-150"></div>
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentQuestionIndex < questions.length ? `Answer: ${currentQuestion.question}` : "All questions completed"}
                className="flex-1 bg-gray-50 border-gray-200 text-dark-900 placeholder:text-gray-500"
                disabled={isLoading || currentQuestionIndex >= questions.length}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim() || currentQuestionIndex >= questions.length}
                className="bg-yellow-500 text-black hover:bg-yellow-400"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}

