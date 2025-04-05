"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type TreeNode = {
  path: string;
  type: "blob" | "tree";
};

export default function GitHubRepoBrowser() {
  const { data: session } = useSession();
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);

  useEffect(() => {
    if (session?.accessToken) {
      fetch("https://api.github.com/user/repos", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
        .then((res) => res.json())
        .then((data) => setRepos(data))
        .catch((err) => console.error(err));
    }
  }, [session]);

  const fetchRepoTree = async () => {
    if (!selectedRepo) return;

    const response = await fetch(
      `/api/github/tree?accessToken=${session?.accessToken}&owner=${session?.user?.name}&repo=${selectedRepo}`
    );

    if (response.ok) {
      const data = await response.json();
      setTree(data);
    } else {
      console.error("Error fetching repo structure");
    }
  };

  const fetchFileContent = async (filePath: string) => {
    setFileContent(null);
    const response = await fetch(
      `https://api.github.com/repos/${session?.user?.name}/${selectedRepo}/contents/${filePath}`,
      {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.content) {
        setFileContent(atob(data.content)); // Decode Base64
      }
    } else {
      console.error("Error fetching file content");
    }
  };

  const buildTree = (nodes: TreeNode[]) => {
    const tree: Record<string, any> = {};
  
    nodes.forEach(({ path, type }) => {
      const parts = path.split("/");
      let current = tree;
  
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
  
        if (!current[part]) {
          current[part] = { __isFile: false }; // Default as folder
        }
  
        if (i === parts.length - 1) {
          current[part].__isFile = type === "blob"; // Mark as file
        }
  
        current = current[part]; // Move deeper into the tree
      }
    });
  
    return tree;
  };
  
  const renderTree = (node: any, path = "") => {
    return Object.entries(node).map(([key, value]: [string, any]) => {
      const fullPath = path ? `${path}/${key}` : key;

      if (value.type === "blob") {
        return (
          <li key={fullPath} className="ml-4 cursor-pointer text-gray-700" onClick={() => fetchFileContent(fullPath)}>
            📄 {key}
          </li>
        );
      }

      return (
        <li key={fullPath} className="ml-2">
          <details open>
            <summary className="cursor-pointer text-blue-500">📂 {key}</summary>
            <ul className="ml-4">{renderTree(value, fullPath)}</ul>
          </details>
        </li>
      );
    });
  };

  return (
    <div className="container mx-auto p-8">
      {!session ? (
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => signIn("github")}>
          Sign in with GitHub
        </button>
      ) : (
        <div>
          <h1 className="text-xl font-bold mb-4">GitHub Repo Browser</h1>

          <select className="border p-2 w-full" value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)}>
            <option value="">-- Select a Repository --</option>
            {repos.map((repo) => (
              <option key={repo.id} value={repo.name}>
                {repo.name}
              </option>
            ))}
          </select>

          <button
            className="bg-green-500 text-white px-4 py-2 mt-4 rounded"
            onClick={fetchRepoTree}
            disabled={!selectedRepo}
          >
            Analyse Repo
          </button>

          {tree.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Repository Files</h2>
              <ul className="border p-4">{renderTree(buildTree(tree))}</ul>
            </div>
          )}

          {fileContent && (
            <div className="mt-6 border p-4 bg-gray-100">
              <h2 className="text-lg font-semibold">File Content</h2>
              <pre className="whitespace-pre-wrap">{fileContent}</pre>
            </div>
          )}

          <button className="bg-red-500 text-white px-4 py-2 mt-4 rounded" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
