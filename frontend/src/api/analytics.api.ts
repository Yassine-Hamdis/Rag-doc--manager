import { http } from "./http";
import type { AnalyticsOverview, DailyStats, TopDocument } from "../types/api";

export const getOverview = () =>
  http.get<AnalyticsOverview>("/analytics/overview");

export const getDailyStats = (days: number = 7) =>
  http.get<DailyStats[]>(`/analytics/daily?days=${days}`);

export const getTopDocuments = (limit: number = 5) =>
  http.get<TopDocument[]>(`/analytics/top-documents?limit=${limit}`);