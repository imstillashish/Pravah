/**
 * Single source of truth for the backend API origin.
 * Override in production with VITE_API_BASE (e.g. https://api.example.com/api);
 * falls back to the Vite dev proxy at /api (see vite.config.ts).
 */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "/api";
