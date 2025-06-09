// src/utils/helpers.js — 2025‑06‑08 — ESM compatible

export function resolveSessionId(req) {
  const sessionId =
    req.headers['x-session-id'] ||    // Explicit header
    req.body?.session_id ||           // From body
    req.cookies?.session_id ||        // From cookie
    req.sessionID ||                  // Express sessionID
    req.session?.id ||                // Fallback 1
    req.session?.session_id ||        // Fallback 2
    null;

  console.log(`[resolveSessionId] resolved sessionId=${sessionId}`);
  return sessionId;
}
