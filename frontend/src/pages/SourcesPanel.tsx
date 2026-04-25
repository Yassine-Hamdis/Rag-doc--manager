import type { ChatSource } from "../types/api";

interface SourcesPanelProps {
  sources: ChatSource[];
}

export function SourcesPanel({ sources }: SourcesPanelProps) {
  if (sources.length === 0) {
    return (
      <div style={{
        padding: "16px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        color: "#666",
        textAlign: "center"
      }}>
        📚 Les sources apparaîtront ici
      </div>
    );
  }

  return (
    <div style={{
      padding: "16px",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
      maxHeight: "500px",
      overflowY: "auto"
    }}>
      <h3 style={{ marginTop: 0, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        📚 Sources ({sources.length})
        <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal" }}>
          (triées par pertinence)
        </span>
      </h3>
      
      {sources.map((source, idx) => (
        <div
          key={idx}
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "white",
            borderRadius: "4px",
            border: "1px solid #e0e0e0"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <strong style={{ color: "#2c3e50" }}>
              {source.doc_name}
              {source.page && ` (page ${source.page})`}
            </strong>
            {source.score !== null && source.score !== undefined && (
              <span style={{
                padding: "2px 8px",
                backgroundColor: source.score > 0.7 ? "#d4edda" : "#fff3cd",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                {(source.score * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <p style={{
            margin: 0,
            fontSize: "13px",
            color: "#555",
            lineHeight: "1.5",
            fontStyle: "italic"
          }}>
            "{source.snippet}..."
          </p>
        </div>
      ))}
    </div>
  );
}