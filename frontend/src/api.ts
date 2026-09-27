/**
 * Single source of truth for the backend API origin.
 * Reads VITE_API_BASE_URL first (Vercel project env), then VITE_API_BASE,
 * then falls back to /api for local dev proxy (see vite.config.ts).
 */
export const API_BASE: string = (
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_BASE ?? "/api"
).replace(/\/+$/, "");
