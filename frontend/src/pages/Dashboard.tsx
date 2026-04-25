import { useState, useEffect } from "react";
import { getOverview } from "../api/analytics.api";
import type { AnalyticsOverview } from "../types/api";

export function Dashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverview()
      .then(res => setOverview(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Chargement...</div>;
  if (!overview) return <div style={{ padding: "40px", color: "red" }}>Erreur de chargement</div>;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>📊 Tableau de bord</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        <StatCard title="📄 Documents" value={overview.total_documents} color="#3498db" />
        <StatCard title="💬 Conversations" value={overview.total_sessions} color="#2ecc71" />
        <StatCard title="❓ Questions" value={overview.total_questions} color="#f39c12" />
        <StatCard title="⚡ Latence (ms)" value={overview.avg_latency_ms} color="#9b59b6" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={{ padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3>📈 Statut des documents</h3>
          {Object.entries(overview.documents_by_status).map(([status, count]) => (
            <div key={status} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span>{status}</span><strong>{count}</strong>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h3>🎯 Traçabilité</h3>
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <div style={{ fontSize: "48px", fontWeight: "bold", color: "#27ae60" }}>
              {overview.traceability_rate}%
            </div>
            <div style={{ color: "#666" }}>réponses avec sources</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div style={{
      padding: "20px", backgroundColor: "white", borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)", borderTop: `4px solid ${color}`
    }}>
      <div style={{ color: "#666", marginBottom: "8px" }}>{title}</div>
      <div style={{ fontSize: "32px", fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}