import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
const { repoName, readmeContent, selectedModules } = await req.json();

  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repoRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repoName,
        private: false,
      }),
    });

    const repoData = await repoRes.json();

    if (!repoRes.ok) {
      return NextResponse.json({ error: repoData.message }, { status: repoRes.status });
    }

    const owner = repoData.owner.login;
    const repo = repoData.name;

    const readmeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/README.md`,
      {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Add README.md",
          content: Buffer.from(readmeContent).toString("base64"),
        }),
      }
    );
    const projectJson = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/project.json`,
      {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Add project.json",
          content: Buffer.from(JSON.stringify(selectedModules, null, 2)).toString("base64"),
        }),
      }
    );
    const readmeData = await readmeRes.json();

    if (!readmeRes.ok) {
      return NextResponse.json({ error: readmeData.message }, { status: readmeRes.status });
    }

    return NextResponse.json({ success: true, repoUrl: repoData.html_url });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
