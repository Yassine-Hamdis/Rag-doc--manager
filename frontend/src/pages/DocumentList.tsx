import { useState } from "react";
import type { DocumentItem } from "../types/api";
import { reindexDoc } from "../api/docs.api";

interface DocumentListProps {
  documents: DocumentItem[];
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export function DocumentList({ documents, onDelete, onRefresh }: DocumentListProps) {
  const [reindexing, setReindexing] = useState<number | null>(null);

  const handleReindex = async (docId: number) => {
    setReindexing(docId);
    try {
      await reindexDoc(docId);
      onRefresh();
    } catch (err) {
      console.error("Failed to reindex", err);
    } finally {
      setReindexing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      INDEXED: { backgroundColor: "#d4edda", color: "#155724" },
      PENDING: { backgroundColor: "#fff3cd", color: "#856404" },
      ERROR: { backgroundColor: "#f8d7da", color: "#721c24" }
    };
    
    const labels: Record<string, string> = {
      INDEXED: "✅ Indexé",
      PENDING: "⏳ En cours",
      ERROR: "❌ Erreur"
    };
    
    return (
      <span style={{
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
        ...styles[status] || { backgroundColor: "#e2e3e5", color: "#383d41" }
      }}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #ddd" }}>
          <th style={{ textAlign: "left", padding: "12px 8px" }}>Nom</th>
          <th style={{ textAlign: "left", padding: "12px 8px" }}>Statut</th>
          <th style={{ textAlign: "left", padding: "12px 8px" }}>Date</th>
          <th style={{ textAlign: "center", padding: "12px 8px" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr key={doc.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "12px 8px" }}>{doc.original_name}</td>
            <td style={{ padding: "12px 8px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {getStatusBadge(doc.status)}
                {doc.error_message && (
                  <span style={{ fontSize: "12px", color: "#e74c3c" }}>
                    {doc.error_message.substring(0, 50)}...
                  </span>
                )}
              </div>
            </td>
            <td style={{ padding: "12px 8px", color: "#666" }}>
              {new Date(doc.created_at).toLocaleString()}
            </td>
            <td style={{ padding: "12px 8px", textAlign: "center" }}>
              {doc.status === "ERROR" && (
                <button
                  onClick={() => handleReindex(doc.id)}
                  disabled={reindexing === doc.id}
                  style={{
                    marginRight: "8px",
                    padding: "4px 12px",
                    backgroundColor: "#f39c12",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  {reindexing === doc.id ? "..." : "🔄 Réessayer"}
                </button>
              )}
              <button
                onClick={() => onDelete(doc.id)}
                style={{
                  padding: "4px 12px",
                  backgroundColor: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                🗑️ Supprimer
              </button>
            </td>
          </tr>
        ))}
        {documents.length === 0 && (
          <tr>
            <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#666" }}>
              Aucun document. Uploadez votre premier PDF !
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}