import { api } from './api.service.js';

/**
 * Démarre une session de test
 * @param {string} token_uuid
 * @returns {Promise<{data, error, status}>}
 */
export async function startSession(token_uuid) {
  return await api.post('/api/v1/tests/sessions/demarrer', {}, { token_uuid });
}

/**
 * Récupère une session par ID
 * @param {string} id
 * @returns {Promise<{data, error, status}>}
 */
export async function getSessionById(id) {
  return await api.get(api.buildUrl('/api/v1/tests/sessions/:session_id', { session_id: id }));
}

/**
 * Soumet une réponse à une question
 * @param {string} sessionId
 * @param {string} questionId
 * @param {any} valeur
 * @param {boolean} estCorrecte
 * @param {boolean} autoPass
 * @param {number} tempsMs
 * @returns {Promise<{data, error, status}>}
 */
export async function submitAnswer(sessionId, payload) {
  return await api.post(
    api.buildUrl('/api/v1/tests/sessions/:session_id/answers', { session_id: sessionId }),
    {},
    payload
  );
}

/**
 * Finalise la session
 * @param {string} session_id
 * @returns {Promise<{data, error, status}>}
 */
export async function finaliserSession(session_id) {
  return await api.post(
    api.buildUrl('/api/v1/tests/sessions/:session_id/finaliser', 
    { session_id }), {}, {}
  );
}

/**
 * Récupère toutes les sessions (avec filtres)
 * @param {object} filters
 * @returns {Promise<{data, error, status}>}
 */
export async function getAllSessions(filters = {}) {
  const { data, error, status } = await api.get(
    '/api/v1/tests/sessions', filters
  );
  console.log('[getAllSessions] data brut →', JSON.stringify(data)?.slice(0, 200));
  // Le backend retourne un tableau direct — normaliser ici
  const sessions = Array.isArray(data) ? data
    : Array.isArray(data?.data) ? data.data
    : [];
  return { data: sessions, error, status };
}

/**
 * Récupère une session avec ses réponses
 * @param {string} sessionId
 * @returns {Promise<{data, error, status}>}
 */
export async function getSessionWithAnswers(sessionId) {
  return await api.get(api.buildUrl('/api/v1/tests/sessions/:session_id', { session_id: sessionId }));
}


