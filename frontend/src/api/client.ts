/**
 * Lightweight API client with Authorization header handling.
 * ponytail: Native fetch wrapper avoids heavy extra dependency while fulfilling Task 45 interceptor requirements.
 */
const getBaseUrl = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || "/api";
  return base.replace(/\/+$/, "");
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

  const base = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http") ? endpoint : `${base}${cleanEndpoint}`;
  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Request failed with status ${res.status}`);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return {} as T;
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export default apiClient;
