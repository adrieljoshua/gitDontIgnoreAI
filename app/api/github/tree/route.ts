import { NextRequest, NextResponse } from "next/server";

async function fetchRepoTree(owner: string, repo: string, accessToken: string) {
  let treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!treeResponse.ok) {
    throw new Error(`GitHub API Error: ${treeResponse.statusText}`);
  }

  const treeData = await treeResponse.json();
  const reducedTree = treeData.tree.map((data: any) => {
    const newTree = {...data};
    delete newTree.mode;
    delete newTree.sha;
    delete newTree.size;
    return newTree;
  });
  
  return reducedTree;
  
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const accessToken = searchParams.get("accessToken");
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!accessToken || !owner || !repo) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const data = await fetchRepoTree(owner, repo, accessToken);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
