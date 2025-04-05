import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "../../../lib/session";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const sessionAccount = await getSessionInfo(sessionId);
  return NextResponse.json(sessionAccount);
}
