import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest) {
  console.log("test...");
  const response = await fetch("https://api.anchorbrowser.io/api/sessions", {
    method: "POST",
    headers: {
      "anchor-api-key": "sk-c1edd4e784a55dd509c967ac57d85ba7",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      headless: false,
      recording: {
        active: true,
      },
      idle_timeout: 1,
      timeout: 10,
    }),
  });

  const json = await response.json();
  return NextResponse.json(json);
}
