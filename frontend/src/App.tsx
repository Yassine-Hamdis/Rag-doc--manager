import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Documents } from "./pages/Documents";
import { Chat } from "./pages/Chat";
import { Dashboard } from "./pages/Dashboard";
import { Navbar } from "./pages/Navbar";
import { ProtectedRoute } from "./auth/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/documents" element={
          <ProtectedRoute>
            <><Navbar /><Documents /></>
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <><Navbar /><Chat /></>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <><Navbar /><Dashboard /></>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}