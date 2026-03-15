import { api } from './api.service.js';

/**
 * Crée un token de test pour un candidat
 * @param {string} candidateId
 * @returns {Promise<{data, error, status}>}
 */
  return await api.post('/api/v1/tests/tokens', {}, { candidateId });
}

/**
 * Vérifie un token par token_uuid
 * @param {string} token_uuid
 * @returns {Promise<{data, error, status}>}
 */
  return await api.get(api.buildUrl('/api/v1/tests/tokens', { token_uuid }));
}

/**
 * Verrouille un token
 * @param {string} token_uuid
 * @param {string} reason
 * @returns {Promise<{data, error, status}>}
 */
  return await api.patch(api.buildUrl('/api/v1/tests/tokens', { token_uuid }), {}, { reason });
}
