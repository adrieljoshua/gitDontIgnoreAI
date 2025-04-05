// relayer.ts
import { SessionInfo } from "../types/session-info";
import { JsonRpcRequest } from "../types/json-rpc-request";

type SessionData = {
  account?: SessionInfo;
  request?: JsonRpcRequest;
  response?: string;
  log: string[];
};

const sessions = new Map<string, SessionData>();

export const setSessionInfo = async (sessionId: string, account: SessionInfo) => {
  const session = sessions.get(sessionId) || { log: [] };
  session.account = account;
  sessions.set(sessionId, session);
};

export const getSessionInfo = async (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (!session?.account) {
    throw new Error("Session account not found");
  }
  return session.account;
};

export const setSessionRequest = async (sessionId: string, request: JsonRpcRequest) => {
  const session = sessions.get(sessionId) || { log: [] };
  session.request = request;
  sessions.set(sessionId, session);
};

export const getSessionRequest = async (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (!session?.request) {
    throw new Error("Session request not found");
  }
  return session.request;
};

export const deleteSessionRequest = async (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (!session || !session.request) {
    throw new Error("Failed to delete session request or it did not exist");
  }
  delete session.request;
};

export const setSessionResponse = async (sessionId: string, response: string) => {
  const session = sessions.get(sessionId) || { log: [] };
  session.response = response;
  sessions.set(sessionId, session);
};

export const getSessionResponse = async (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (!session?.response) {
    throw new Error("Session response not found");
  }
  return session.response;
};

export const deleteSessionResponse = async (sessionId: string) => {
  const session = sessions.get(sessionId);
  if (!session || !session.response) {
    throw new Error("Failed to delete session response or it did not exist");
  }
  delete session.response;
};

export const setSessionLog = async (sessionId: string, log: string) => {
  const session = sessions.get(sessionId) || { log: [] };
  session.log.push(log);
  sessions.set(sessionId, session);
};

export const getSessionLog = async (sessionId: string): Promise<string[]> => {
  const session = sessions.get(sessionId);
  if (!session?.log) {
    throw new Error("Session log not found");
  }
  return session.log;
};

export const waitForSessionResponse = async (
  sessionId: string,
  timeout = 60000,
  interval = 1000
): Promise<any> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const session = sessions.get(sessionId);
    if (session?.response) {
      return session.response;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error("Timeout waiting for session response");
};