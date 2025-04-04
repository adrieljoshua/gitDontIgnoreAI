import { NextResponse } from "next/server";

interface DeployRequest {
  vercelApiKey: string;
  githubApiKey: string;
  githubRepo: string;
  branch?: string;
  project: string;
  target?: string;
}

export async function POST(req: Request) {
  try {
    const { vercelApiKey, githubApiKey, githubRepo, branch = "main", project, target = "preview" }: DeployRequest = await req.json();

    if (!vercelApiKey || !githubApiKey || !githubRepo || !project) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Fetch GitHub repo details to get repo ID
    const repoResponse = await fetch(`https://api.github.com/repos/${githubRepo}`, {
      headers: {
        Authorization: `Bearer ${githubApiKey}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!repoResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch GitHub repository" }, { status: repoResponse.status });
    }

    const repoData = await repoResponse.json();
    const repoId = repoData.id;

    // Deploy to Vercel
    const deployResponse = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: githubRepo.split("/").pop(),
        project,
        target,
        gitSource: {
          type: "github",
          repoId: repoId,
          ref: branch,
        },
        gitMetadata: {
          remoteUrl: `https://github.com/${githubRepo}`,
          commitRef: branch,
        },
        projectSettings: {
          installCommand: "npm install",
          buildCommand: "next build",
          outputDirectory: ".next",
          framework: "nextjs"
        }
      }),
    });

    const data = await deployResponse.json();

    if (!deployResponse.ok) {
      return NextResponse.json({ error: data.error }, { status: deployResponse.status });
    }

    return NextResponse.json({ deployment: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
