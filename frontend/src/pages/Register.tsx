import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth.api";
import "./auth.css";

export function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await register({ email, password });
      nav("/login");
    } catch (e: any) {
      setErr(e?.response?.data?.detail ?? "Erreur d'inscription");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Créer un compte</h1>
          <p className="auth-subtitle">
            Crée ton compte pour uploader des documents et utiliser le chat.
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
              placeholder="Choisir un mot de passe"
              autoComplete="new-password"
              required
            />
          </div>

          {err && (
            <div className="auth-alert" role="alert" aria-live="polite">
              {err}
            </div>
          )}

          <button className="auth-button" type="submit">
            Créer
          </button>
        </form>

        <p className="auth-footer">
          Déjà un compte ?{" "}
          <Link className="auth-link" to="/login">
            Connexion
          </Link>
        </p>
      </div>
    </div>
  );
}