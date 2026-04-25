import { useState } from "react";
import { ask, getSession } from "../api/chat.api";
import type { ChatSource, Message } from "../types/api";
import { SessionSidebar } from "./SessionSidebar";
import { SourcesPanel } from "./SourcesPanel";
import { DocumentFilter } from "./DocumentFilter";

export function Chat() {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [retrievalMode, setRetrievalMode] = useState<"vector" | "bm25" | "hybrid">("hybrid");
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]); // ⭐ NOUVEAU

  const loadSession = async (sessionId: number) => {
    try {
      const res = await getSession(sessionId);
      setMessages(res.data.messages);
      setCurrentSessionId(sessionId);
    } catch (err) { console.error(err); }
  };

  const handleNewSession = () => {
    setMessages([]);
    setSources([]);
    setCurrentSessionId(null);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const q = question.trim();
    setQuestion("");
    setLoading(true);

    setMessages(prev => [...prev, {
      id: Date.now(), role: "user", content: q, created_at: new Date().toISOString()
    }]);

    try {
      const res = await ask({
        question: q, 
        top_k: 4, 
        retrieval_mode: retrievalMode, 
        session_id: currentSessionId,
        doc_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined  // ⭐ NOUVEAU
      });
      setMessages(prev => [...prev, {
        id: res.data.message_id, role: "assistant", content: res.data.answer,
        sources: res.data.sources, created_at: new Date().toISOString()
      }]);
      setSources(res.data.sources);
      if (!currentSessionId) setCurrentSessionId(res.data.session_id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
      <SessionSidebar
        currentSessionId={currentSessionId}
        onSelectSession={loadSession}
        onNewSession={handleNewSession}
      />

      <div style={{ flex: 1, display: "flex", padding: "20px", gap: "20px" }}>
        <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontWeight: "bold", marginRight: "8px" }}>Mode :</label>
            <select 
              value={retrievalMode} 
              onChange={(e) => setRetrievalMode(e.target.value as any)}
              style={{ padding: "8px", borderRadius: "4px" }}
            >
              <option value="hybrid">🔀 Hybride</option>
              <option value="vector">🧠 Vectoriel</option>
              <option value="bm25">📊 BM25</option>
            </select>
          </div>

          {/* ⭐ NOUVEAU : Filtre par documents */}
          <DocumentFilter 
            selectedDocIds={selectedDocIds} 
            onChange={setSelectedDocIds} 
          />

          <div style={{
            flex: 1, overflowY: "auto", border: "1px solid #ddd",
            borderRadius: "8px", padding: "16px", backgroundColor: "#fafafa", marginBottom: "16px"
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "#666", padding: "40px" }}>
                💬 Commencez une conversation
                {selectedDocIds.length > 0 && (
                  <div style={{ marginTop: "12px", fontSize: "13px", color: "#3498db" }}>
                    🎯 Recherche limitée à {selectedDocIds.length} document(s)
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} style={{ marginBottom: "16px" }}>
                  <div style={{
                    fontWeight: "bold", marginBottom: "4px",
                    color: msg.role === "user" ? "#3498db" : "#2ecc71"
                  }}>
                    {msg.role === "user" ? "👤 Vous" : "🤖 Assistant"}
                  </div>
                  <div style={{
                    padding: "12px",
                    backgroundColor: msg.role === "user" ? "#e3f2fd" : "#e8f5e9",
                    borderRadius: "8px", whiteSpace: "pre-wrap"
                  }}>{msg.content}</div>
                </div>
              ))
            )}
            {loading && <div style={{ color: "#666", fontStyle: "italic" }}>🤔 Réflexion...</div>}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <input 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Posez votre question..."
              disabled={loading}
              style={{ flex: 1, padding: "12px", borderRadius: "4px", border: "1px solid #ddd" }} 
            />
            <button 
              onClick={handleAsk} 
              disabled={loading || !question.trim()} 
              style={{
                padding: "12px 24px", backgroundColor: "#3498db", color: "white",
                border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold"
              }}
            >
              {loading ? "..." : "Envoyer"}
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <SourcesPanel sources={sources} />
        </div>
      </div>
    </div>
  );
}