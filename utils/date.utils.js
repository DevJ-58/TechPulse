/**
 * Formate un timestamp en "15 mars 2026"
 * @param {number|string|Date} timestamp
 * @returns {string}
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Formate un timestamp en "15 mars 2026 · 10h00"
 * @param {number|string|Date} timestamp
 * @returns {string}
 */
export function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ' · ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Retourne "il y a X" pour un timestamp
 * @param {number|string|Date} timestamp
 * @returns {string}
 */
export function timeAgo(timestamp) {
  const now = Date.now();
  const date = new Date(timestamp).getTime();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `il y a ${diff} sec`;
  if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
  if (diff < 2592000) return `il y a ${Math.floor(diff/86400)} jours`;
  return formatDate(date);
}

/**
 * Retourne une string ISO locale pour input datetime-local
 * @param {Date} date
 * @returns {string}
 */
export function toISOLocal(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0,16);
}

