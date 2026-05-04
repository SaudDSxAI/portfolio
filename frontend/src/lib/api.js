/**
 * Central API utility
 * In dev (Vite): requests use relative URLs (e.g. /api/projects) and Vite's
 * proxy in vite.config.js forwards them to FastAPI on :8000. This avoids
 * cross-origin requests entirely.
 * In prod: same origin serves both the React SPA and the FastAPI backend,
 * so relative URLs also Just Work. VITE_API_URL is honored if set.
 */

const BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch(path, opts = {}) {
  // Default 8s for most calls; /api/projects on a cold cache makes one LLM
  // call per repo and can legitimately take 30–60s, so the caller can override.
  const { timeoutMs = 8000, ...fetchOptions } = opts;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...fetchOptions,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || `HTTP ${res.status}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Fetch the LLM-enriched project list (cached 1h on the server). */
export const fetchProjects = (forceRefresh = false) =>
  apiFetch(`/api/projects${forceRefresh ? '?refresh=true' : ''}`, {
    timeoutMs: 60000, // cold-cache LLM enrichment can take a while
  });

/** Force a full rebuild of the projects cache. */
export const refreshProjects = () =>
  apiFetch('/api/projects/refresh', { method: 'POST', timeoutMs: 90000 });
