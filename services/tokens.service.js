import { api } from './api.service.js';
import API_CONFIG from '../config/api.config.js';

/**
 * Crée un token de test pour un candidat
 * @param {object} data - { candidat_id, ... }
 * @returns {Promise<{data, error, status}>}
 */
export async function createToken(data) {
  console.log('[createToken] payload →', JSON.stringify(data));
  const result = await api.post(API_CONFIG.ENDPOINTS.TEST_TOKENS, {}, data);
  console.log('[createToken] réponse brute →', JSON.stringify(result));
  if (result.data?.detail) {
    result.data.detail.forEach((e, i) => {
      console.error(`[TOKEN 422 champ ${i}]`, 
        'loc:', e.loc?.join(' → '), 
        '| msg:', e.msg, 
        '| reçu:', e.input
      );
    });
  }
  return result;
}

/**
 * Vérifie un token par token_uuid
 * @param {string} token_uuid
 * @returns {Promise<{data, error, status}>}
 */
export async function getToken(token_uuid) {
  return await api.get(api.buildUrl('/api/v1/tests/tokens/:token_uuid', { token_uuid }));
}

/**
 * Verrouille un token
 * @param {string} token_uuid
 * @param {string} reason
 * @returns {Promise<{data, error, status}>}
 */
export async function lockToken(token_uuid, reason) {
  return await api.patch(api.buildUrl('/api/v1/tests/tokens/:token_uuid', { token_uuid }), {}, { reason });
}

