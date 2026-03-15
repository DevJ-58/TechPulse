import { api } from './api.service.js';
import API_CONFIG from '../config/api.config.js';

/**
 * Authentifie un admin et stocke le token JWT et le nom dans sessionStorage
 * @param {string} email
 * @param {string} mot_de_passe
 * @returns {Promise<{data, error, status}>}
 */

export async function login(email, mot_de_passe) {
  console.log('[login] appelé avec', email, mot_de_passe);
  try {
    const { data, error, status } = await api.post(API_CONFIG.ENDPOINTS.ADMIN_CONNEXION, {}, { email, mot_de_passe });
    console.log('[login] retour api.post', { data, error, status });
    if (data?.token_acces) {
      sessionStorage.setItem('tp_admin_token', data.token_acces);
      sessionStorage.setItem('tp_admin_name', data.nom || '');
      console.log('[login] token stocké', data.token_acces);
    } else {
      console.warn('[login] Pas de token_acces dans data', data);
    }
    return { data, error, status };
  } catch (err) {
    console.error('[login] Exception', err);
    return { data: null, error: err.message, status: 0 };
  }
}



/**
 * Déconnecte l'admin et efface la session
 * @returns {Promise<{data, error, status}>}
 */
export async function logout() {
  const { data, error, status } = await api.post(api.buildUrl('/admins/deconnexion'));
  sessionStorage.clear();
  return { data, error, status };
}

/**
 * Récupère les infos de l'admin connecté
 * @returns {Promise<{data, error, status}>}
 */
export async function getMe() {
  return await api.get(api.buildUrl('/admins/me'));
}
