import { getSessionInfo } from "../../../lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const { anchorSessionId } = await getSessionInfo(sessionId);
  const response = await fetch(
    `https://api.anchorbrowser.io/api/sessions/${anchorSessionId}/recording`,
    {
      method: "GET",
      headers: {
        "anchor-api-key": "sk-c1edd4e784a55dd509c967ac57d85ba7",
      },
    }
  );
  let recordingUrl = "";
  if (response.ok) {
    const { data } = await response.json();
    recordingUrl = data.videos[0];
  }
  return NextResponse.json({ recordingUrl });
}
