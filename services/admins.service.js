import { api } from './api.service.js';
import API_CONFIG from '../config/api.config.js';
import { setAdminName } from '../utils/auth.utils.js';

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
    if (data?.jetons?.token_acces || data?.token_acces || data?.token) {
      const rawToken = data.jetons?.token_acces || data.token_acces || data.token;
      const token = String(rawToken || '').trim();
      sessionStorage.setItem('tp_admin_token', token);
      const admin = data?.admin || data?.user || {};
      const fullName = [admin?.prenom, admin?.nom].filter(Boolean).join(' ').trim() || admin?.nom || admin?.prenom || admin?.name || data?.nom || '';
      setAdminName(fullName);
      console.log('[login] token stocké', data.jetons?.token_acces || data.token_acces || data.token);
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
  const { data, error, status } = await api.post(API_CONFIG.ENDPOINTS.ADMIN_DECONNEXION, {});
  sessionStorage.clear();
  return { data, error, status };
}

/**
 * Récupère les infos de l'admin connecté
 * @returns {Promise<{data, error, status}>}
 */
export async function getMe() {
  return await api.get(API_CONFIG.ENDPOINTS.ADMIN_ME);
}

/**
 * Crée un nouveau compte admin
 * @param {object} payload — { prenom, nom, email, mot_de_passe }
 * @returns {Promise<{data, error, status}>}
 */
export async function register(payload) {
  try {
    const { data, error, status } = await api.post(
      API_CONFIG.ENDPOINTS.ADMIN_INSCRIPTION, {}, payload
    );
    return { data, error, status };
  } catch(e) {
    console.error('[register] exception', e);
    return { data: null, error: e.message, status: 0 };
  }
}

/**
 * Met à jour les infos du profil admin
 * @param {object} payload — { prenom, nom, email }
 * @returns {Promise<{data, error, status}>}
 */
export async function updateMe(payload) {
  console.log('[updateMe] endpoint →', API_CONFIG.ENDPOINTS.ADMIN_ME);
  console.log('[updateMe] payload →', JSON.stringify(payload));
  const result = await api.patch(API_CONFIG.ENDPOINTS.ADMIN_ME, {}, payload);
  console.log('[updateMe] réponse →', JSON.stringify(result));
  return result;
}

/**
 * Modifie le mot de passe du profil admin
 * @param {object} payload — { mot_de_passe_actuel, nouveau_mot_de_passe }
 * @returns {Promise<{data, error, status}>}
 */
export async function updatePassword(payload) {
  console.log('[updatePassword] endpoint →', 
    API_CONFIG.ENDPOINTS.ADMIN_ME + '/password');
  console.log('[updatePassword] payload →', JSON.stringify(payload));
  const result = await api.patch(
    API_CONFIG.ENDPOINTS.ADMIN_ME + '/password', {}, payload
  );
  console.log('[updatePassword] réponse →', JSON.stringify(result));
  return result;
}

