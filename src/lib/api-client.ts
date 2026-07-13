import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "./types";
import { clearStoredToken, getStoredToken } from "./storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";

// Re-exported for existing call sites (hooks/use-auth.tsx). Prefer importing
// directly from "./storage" in new code.
export { getStoredToken as getToken, setStoredToken as setToken, clearStoredToken as clearToken } from "./storage";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearStoredToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts a human-readable message from either:
 *  - the real backend's standardized ErrorResponse (see GlobalExceptionHandler), or
 *  - a plain Error thrown by the mock API layer (src/lib/mock/mock-api.ts), which is
 *    used whenever NEXT_PUBLIC_USE_MOCK_API is on.
 * so components never need to know which one is currently active.
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.fieldErrors && Object.keys(body.fieldErrors).length > 0) {
      return Object.values(body.fieldErrors)[0];
    }
    if (body?.message) return body.message;
    if (error.code === "ERR_NETWORK") return "Can't reach the server. Is the backend running?";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
