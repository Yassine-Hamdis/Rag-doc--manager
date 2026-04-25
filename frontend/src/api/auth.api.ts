import { http } from "./http";
import type { LoginRequest, TokenResponse, MeResponse } from "../types/api";

export const register = (payload: LoginRequest) =>
  http.post("/auth/register", payload);

export const login = (payload: LoginRequest) =>
  http.post<TokenResponse>("/auth/login", payload);

export const me = () => http.get<MeResponse>("/auth/me");