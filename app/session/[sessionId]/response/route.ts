import { NextRequest, NextResponse } from "next/server";
import { setSessionResponse } from "../../../lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await req.json();
  const { result } = body;
  await setSessionResponse(sessionId, result);
  return NextResponse.json({});
}
