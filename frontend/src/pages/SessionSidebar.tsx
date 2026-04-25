import { useState, useEffect } from "react";
import { listSessions, createSession, deleteSession } from "../api/chat.api";
import type { ChatSession } from "../types/api";

interface SessionSidebarProps {
  currentSessionId: number | null;
  onSelectSession: (sessionId: number) => void;
  onNewSession: () => void;
}

export function SessionSidebar({ currentSessionId, onSelectSession, onNewSession }: SessionSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const res = await listSessions();
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to load sessions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleNewSession = async () => {
    try {
      const res = await createSession();
      setSessions([res.data, ...sessions]);
      onNewSession();
      onSelectSession(res.data.id);
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Supprimer cette conversation ?")) return;
    
    try {
      await deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        onNewSession();
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{
      width: "280px",
      height: "100%",
      backgroundColor: "#f5f5f5",
      borderRight: "1px solid #ddd",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ padding: "16px", borderBottom: "1px solid #ddd" }}>
        <button
          onClick={handleNewSession}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold"
          }}
        >
          + Nouvelle conversation
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            Chargement...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            Aucune conversation
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              style={{
                padding: "12px",
                marginBottom: "8px",
                backgroundColor: currentSessionId === session.id ? "#e3f2fd" : "white",
                borderRadius: "4px",
                cursor: "pointer",
                border: currentSessionId === session.id ? "2px solid #3498db" : "1px solid #ddd",
                transition: "all 0.2s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", marginBottom: "4px", fontSize: "14px" }}>
                    {session.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {formatDate(session.updated_at)} • {session.message_count} messages
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "transparent",
                    color: "#e74c3c",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}