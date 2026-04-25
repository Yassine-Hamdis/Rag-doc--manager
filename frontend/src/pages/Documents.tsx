import { useEffect, useState } from "react";
import type { DocumentItem } from "../types/api";
import { uploadPdf, listDocs, deleteDoc } from "../api/docs.api";
import { DocumentList } from "./DocumentList";

export function Documents() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const res = await listDocs();
      setDocs(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const onUpload = async () => {
    setMsg(null); setErr(null);
    if (!file) return;
    try {
      setMsg("Upload en cours...");
      await uploadPdf(file);
      setFile(null);
      await refresh();
      setMsg("Document uploadé ! Indexation en arrière-plan...");
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Erreur upload");
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Supprimer ce document ?")) return;
    await deleteDoc(id);
    await refresh();
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>📄 Gestion des documents</h2>

      <div style={{
        padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px",
        marginBottom: "24px", border: "1px solid #ddd"
      }}>
        <h3 style={{ marginTop: 0 }}>📤 Upload PDF</h3>
        <input type="file" accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button onClick={onUpload} style={{
          marginLeft: "10px", padding: "8px 16px", backgroundColor: "#3498db",
          color: "white", border: "none", borderRadius: "4px", cursor: "pointer"
        }}>Upload</button>
        {msg && <div style={{ color: "green", marginTop: "10px" }}>{msg}</div>}
        {err && <div style={{ color: "red", marginTop: "10px" }}>{err}</div>}
      </div>

      <DocumentList documents={docs} onDelete={onDelete} onRefresh={refresh} />
    </div>
  );
}