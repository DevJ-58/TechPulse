// Wrapper fetch centralisé pour TechPulse
import API_CONFIG from '../config/api.config.js';
import { showToast } from '../utils/toast.utils.js';

/**
 * Remplace les :param dans l'endpoint par les valeurs de params
 * @param {string} endpoint
 * @param {object} params
 * @returns {string}
 */
function buildUrl(endpoint, params = {}) {
  let url = endpoint;
  for (const key in params) {
    url = url.replace(`:${key}`, encodeURIComponent(params[key]));
  }
  return url;
}

/**
 * Effectue une requête API avec gestion des headers, timeout, erreurs, etc.
 * @param {string} method
 * @param {string} endpoint
 * @param {object} params
 * @param {object} body
 * @returns {Promise<{data: any, error: any, status: number}>}
 */
async function request(method, endpoint, params = {}, body = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  let url = API_CONFIG.BASE_URL + buildUrl(endpoint, params);
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  const token = sessionStorage.getItem('tp_admin_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  console.log('[api.request] fetch', { method, url, headers, body });
  try {
    const res = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
      body: body ? JSON.stringify(body) : undefined,
    });
    clearTimeout(timeoutId);
    const status = res.status;
    let data = null;
    let error = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
      console.warn('[api.request] Réponse non JSON', e);
    }
    if (!res.ok) {
      if (status === 401) {
        sessionStorage.clear();
        window.location.href = '/admin/login.html';
        return { data: null, error: 'Non autorisé', status };
      }
      if (status >= 500) {
        showToast(data?.detail || 'Erreur serveur', 'error');
      }
      error = data?.detail || 'Erreur inconnue';
      console.warn('[api.request] Erreur HTTP', { status, data, error });
    }
    console.log('[api.request] retour', { data, error, status });
    return { data, error, status };
  } catch (err) {
    if (err.name === 'AbortError') {
      showToast('Erreur réseau — vérifie ta connexion', 'error');
      console.error('[api.request] Timeout', err);
      return { data: null, error: 'Timeout', status: 0 };
    }
    showToast('Erreur réseau — vérifie ta connexion', 'error');
    console.error('[api.request] Exception', err);
    return { data: null, error: err.message, status: 0 };
  }
}

export const api = {
  get:    (endpoint, params)        => request('GET', endpoint, params),
  post:   (endpoint, params, body)  => request('POST', endpoint, params, body),
  put:    (endpoint, params, body)  => request('PUT', endpoint, params, body),
  patch:  (endpoint, params, body)  => request('PATCH', endpoint, params, body),
  delete: (endpoint, params)        => request('DELETE', endpoint, params),
  buildUrl,
};
