import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth.api";
import { useAuth } from "../auth/AuthContext";
import "./auth.css";

export function Login() {
  const nav = useNavigate();
  const { setToken, refreshMe } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const res = await login({ email, password });
      setToken(res.data.access_token);
      await refreshMe();
      nav("/documents");
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Erreur de connexion");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Connexion</h1>
          <p className="auth-subtitle">
            Connecte-toi pour accéder à tes documents et à l’assistant.
          </p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@exemple.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {err && (
            <div className="auth-alert" role="alert" aria-live="polite">
              {err}
            </div>
          )}

          <button className="auth-button" type="submit">
            Se connecter
          </button>
        </form>

        <p className="auth-footer">
          Pas de compte ? <Link className="auth-link" to="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}