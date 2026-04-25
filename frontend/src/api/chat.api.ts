import { http } from "./http";
import type { 
  ChatAskRequest, 
  ChatAskResponse, 
  ChatSession, 
  ChatSessionDetail 
} from "../types/api";

export const ask = (payload: ChatAskRequest) =>
  http.post<ChatAskResponse>("/chat/ask", payload);

export const createSession = (title?: string) =>
  http.post<ChatSession>("/chat/sessions", { title: title || "Nouvelle conversation" });

export const listSessions = () =>
  http.get<ChatSession[]>("/chat/sessions");

export const getSession = (sessionId: number) =>
  http.get<ChatSessionDetail>(`/chat/sessions/${sessionId}`);

export const deleteSession = (sessionId: number) =>
  http.delete(`/chat/sessions/${sessionId}`);