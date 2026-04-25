import { http } from "./http";
import type { DocumentItem } from "../types/api";

export const uploadPdf = (file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return http.post<DocumentItem>("/docs/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const listDocs = () => http.get<DocumentItem[]>("/docs");

export const deleteDoc = (docId: number) => http.delete(`/docs/${docId}`);

export const reindexDoc = (docId: number) => http.post(`/docs/${docId}/reindex`);