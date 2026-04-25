export type LoginRequest = { email: string; password: string };
export type TokenResponse = { access_token: string; token_type: "bearer" };
export type MeResponse = { id: number; email: string };

export type DocumentItem = {
  id: number;
  original_name: string;
  status: "PENDING" | "INDEXED" | "ERROR" | string;
  created_at: string;
  error_message?: string | null;
};

export type ChatAskRequest = { 
  question: string; 
  top_k?: number;
  retrieval_mode?: "vector" | "bm25" | "hybrid";
  session_id?: number | null;
  doc_ids?: number[];  // ⭐ NOUVEAU : filtre par documents
};

export type ChatSource = {
  doc_id: number;
  doc_name: string;
  page: number | null;
  snippet: string;
  score?: number | null;
};

export type ChatAskResponse = { 
  answer: string; 
  sources: ChatSource[];
  session_id: number;
  message_id: number;
};

export type ChatSession = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
};

export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[] | null;
  latency_ms?: number | null;
  created_at: string;
};

export type ChatSessionDetail = ChatSession & {
  messages: Message[];
};

export type AnalyticsOverview = {
  total_documents: number;
  total_sessions: number;
  total_questions: number;
  avg_latency_ms: number;
  traceability_rate: number;
  documents_by_status: Record<string, number>;
};

export type DailyStats = {
  date: string;
  questions: number;
  avg_latency_ms: number;
};

export type TopDocument = {
  doc_id: number;
  doc_name: string;
  usage_count: number;
};