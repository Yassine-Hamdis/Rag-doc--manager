import { useState, useEffect } from "react";
import { listDocs } from "../api/docs.api";
import type { DocumentItem } from "../types/api";

interface DocumentFilterProps {
  selectedDocIds: number[];
  onChange: (docIds: number[]) => void;
}

export function DocumentFilter({ selectedDocIds, onChange }: DocumentFilterProps) {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDocs()
      .then(res => {
        setDocs(res.data.filter(d => d.status === "INDEXED"));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleDoc = (docId: number) => {
    if (selectedDocIds.includes(docId)) {
      onChange(selectedDocIds.filter(id => id !== docId));
    } else {
      onChange([...selectedDocIds, docId]);
    }
  };

  const selectAll = () => onChange(docs.map(d => d.id));
  const clearAll = () => onChange([]);

  return (
    <div style={{
      backgroundColor: "white",
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "16px"
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none"
        }}
      >
        <strong style={{ fontSize: "14px" }}>
          🔍 Filtrer par documents 
          {selectedDocIds.length > 0 && (
            <span style={{ 
              marginLeft: "8px", 
              padding: "2px 8px", 
              backgroundColor: "#3498db", 
              color: "white", 
              borderRadius: "12px",
              fontSize: "12px"
            }}>
              {selectedDocIds.length} sélectionné(s)
            </span>
          )}
          {selectedDocIds.length === 0 && (
            <span style={{ 
              marginLeft: "8px", 
              fontSize: "12px",
              color: "#666",
              fontWeight: "normal"
            }}>
              (tous les documents)
            </span>
          )}
        </strong>
        <span style={{ color: "#666" }}>{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee" }}>
          {loading ? (
            <div style={{ color: "#666", fontSize: "14px", textAlign: "center", padding: "10px" }}>
              Chargement...
            </div>
          ) : docs.length === 0 ? (
            <div style={{ color: "#666", fontSize: "14px", textAlign: "center", padding: "10px" }}>
              Aucun document indexé disponible
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "8px", display: "flex", gap: "8px" }}>
                <button 
                  onClick={selectAll} 
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    backgroundColor: "#2ecc71",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  ✅ Tout sélectionner
                </button>
                <button 
                  onClick={clearAll} 
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    backgroundColor: "#95a5a6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  ❌ Tout désélectionner
                </button>
              </div>

              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {docs.map(doc => (
                  <label 
                    key={doc.id} 
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px",
                      cursor: "pointer",
                      backgroundColor: selectedDocIds.includes(doc.id) ? "#e3f2fd" : "transparent",
                      borderRadius: "4px",
                      marginBottom: "4px",
                      transition: "background-color 0.2s"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(doc.id)}
                      onChange={() => toggleDoc(doc.id)}
                      style={{ marginRight: "10px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "14px" }}>📄 {doc.original_name}</span>
                  </label>
                ))}
              </div>

              {selectedDocIds.length === 0 && (
                <div style={{ 
                  marginTop: "8px", 
                  fontSize: "12px", 
                  color: "#666", 
                  fontStyle: "italic",
                  textAlign: "center"
                }}>
                  💡 Aucun filtre = recherche dans tous les documents
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}