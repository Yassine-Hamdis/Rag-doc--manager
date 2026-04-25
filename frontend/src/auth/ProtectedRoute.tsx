import React, { type JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}