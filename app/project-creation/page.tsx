"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

declare global {
  interface Window {
    ethereum?: any;
  }
}
import { signIn, signOut, useSession } from "next-auth/react";

import FreelanceProject from "../contracts/FreelanceProject.json";
import { ethers } from "ethers";

const PROJECT_CONTRACT = "0x7A0399618B0bde2eeBdcAA4c1C9Da2883D118b3d";

const { abi } = FreelanceProject.output;

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

export default function ChatComponent() {
  const { data: session } = useSession();
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesParsed, setModulesParsed] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (response && !modulesParsed) {
      try {
        const cleanedResponse = response.replace(/^```json\n|```$/g, "");
        const data = JSON.parse(cleanedResponse);

        const initialModules = data.map((mod: any) => ({
          ...mod,
          selected: true,
          submodules: mod.submodules.map((sub: any) => ({
            ...sub,
            selected: true,
          })),
        }));

        setModules(initialModules);
        setModulesParsed(true);
      } catch (error) {
        console.error("Error parsing response:", error);
        setModules([]);
      }
    }
  }, [response, modulesParsed]);

  async function registerProjectOnChain(githubRepo: string) {
    if (!window.ethereum) {
      alert("MetaMask is required to register the project.");
      return;
    }
  
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(PROJECT_CONTRACT, abi, signer);
  
      // Prepare module data for the contract
      const selectedModules = modules.filter(mod => mod.selected);
      const moduleNames = selectedModules.map(mod => mod.module);
      const moduleWeights = selectedModules.map(mod => mod.weightage);
      const submoduleNames = selectedModules.map(mod => 
        mod.submodules.filter(sub => sub.selected).map(sub => sub.title)
      );
  
      // Ensure total weightage sums to 100

  
      // Single transaction to register project with modules
      const tx = await contract.registerProject(
        projectName,
        description,
        ethers.parseEther(amount),
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

  const sendPrompt = async () => {
    if (!tagline.trim() || !description.trim()) return;
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagline, description }),
      });

      const data = await res.json();
      if (data.response) {
        setResponse(data.response);
      } else {
        setResponse("Error fetching AI response.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setResponse("Error occurred. Please try again.");
    }
    setLoading(false);
  };

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

  async function createRepo() {
    if (!session) {
      alert("Please sign in with GitHub first.");
      return;
    }
  
    if (!projectName.trim()) {
      alert("Repository name is required.");
      return;
    }
  
    setLoading(true);
  
    try {
      const projectData = {
        tagline,
        description,
        modules: selectedModules,
      };
  
      // Step 1: Generate README content
      const projectMarkdown = await fetch("/api/create-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      }).then((res) => res.json());
  
      // Step 2: Create GitHub Repo
      const payload = {
        repoName: projectName,
        readmeContent: projectMarkdown.response,
        selectedModules,
      };

      const repoRes = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
  
      const repoData = await repoRes.json();
      if (!repoData.success) {
        alert("Error creating repository: " + repoData.error);
        return;
      }
  
      // Step 3: Register project on blockchain
      await registerProjectOnChain(repoData.repoUrl);
      
      alert(`Repository '${projectName}' created and registered successfully!`);
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <div className="max-w-lg mx-auto p-6 border rounded-lg shadow-lg">
      <h1 className="text-xl font-bold mb-4">Create Project</h1>

      {!session ? (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => signIn("github")}
        >
          Sign in with GitHub
        </button>
      ) : (
        <div className="mb-4">
          <p>Signed in as {session.user?.name}</p>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded mt-2"
            onClick={() => signOut()}
          >
            Sign Out
          </button>
        </div>
      )}

      <input
        className="w-full p-2 border rounded"
        placeholder="Project Tagline..."
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
      /> 
      <input
      className="w-full p-2 border rounded"
      placeholder="Project name..."
      value={projectName}
      onChange={(e) => setProjectName(e.target.value)}
    />

      <textarea
        className="w-full p-2 border rounded mt-4"
        placeholder="Project Description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        className="w-full p-2 border rounded mt-4"
        placeholder="Amount in cUSD..."
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
        onClick={sendPrompt}
        disabled={loading}
      >
        {loading ? "Loading..." : "Submit"}
      </button>

      {modules.length > 0 && (
        <div className="mt-4">
          <ul>
            {modules.map((mod, mIndex) => (
              <li key={mIndex} className="mb-4">
                <label className="font-semibold flex items-center">
                  <input
                    type="checkbox"
                    checked={mod.selected}
                    onChange={() => toggleModule(mIndex)}
                    className="mr-2"
                  />
                  {mod.module}
                </label>
                <ul className="ml-6 mt-2">
                  {mod.submodules.map((sub, sIndex) => (
                    <li key={sIndex} className="mb-2">
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

          {session && tagline && (
            <button
              className="mt-4 bg-purple-500 text-white px-4 py-2 rounded"
              onClick={createRepo}
            >
              Create GitHub Repo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
