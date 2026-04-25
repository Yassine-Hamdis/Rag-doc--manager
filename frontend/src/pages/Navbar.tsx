import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 24px",
      backgroundColor: "#1a1a2e",
      color: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>📚 RAG Doc Manager</h1>
        
        <div style={{ display: "flex", gap: "16px" }}>
          <Link
            to="/documents"
            style={{
              color: "white",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              backgroundColor: isActive("/documents") ? "#16213e" : "transparent",
              transition: "background-color 0.2s"
            }}
          >
            📄 Documents
          </Link>
          <Link
            to="/chat"
            style={{
              color: "white",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              backgroundColor: isActive("/chat") ? "#16213e" : "transparent",
              transition: "background-color 0.2s"
            }}
          >
            💬 Chat
          </Link>
          <Link
            to="/dashboard"
            style={{
              color: "white",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              backgroundColor: isActive("/dashboard") ? "#16213e" : "transparent",
              transition: "background-color 0.2s"
            }}
          >
            📊 Dashboard
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ color: "#ccc" }}>{user?.email}</span>
        <button
          onClick={logout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}