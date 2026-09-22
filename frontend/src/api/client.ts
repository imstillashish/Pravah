/**
 * Lightweight API client with Authorization header handling.
 * ponytail: Native fetch wrapper avoids heavy extra dependency while fulfilling Task 45 interceptor requirements.
 */
const getBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || "/api";
};

export async function apiClient<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${getBaseUrl()}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default apiClient;
