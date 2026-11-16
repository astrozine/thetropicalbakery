/**
 * Tells the server a form was just saved, so Andrew and Dolly get an e-mail about it
 * (see src/lib/email/alerts.ts). Fire-and-forget: it never slows down or breaks the form,
 * and `keepalive` lets it finish even when the page opens WhatsApp or closes right after.
 */
export function pingAlerts() {
  try {
    void fetch('/api/alerts', { method: 'POST', keepalive: true }).catch(() => {});
  } catch { /* never let an alert break a form */ }
}
