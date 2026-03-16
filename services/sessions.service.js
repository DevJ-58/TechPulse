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
export async function submitAnswer(sessionId, questionId, valeur, estCorrecte, autoPass, tempsMs) {
  return await api.post(api.buildUrl('/api/v1/tests/sessions/:session_id/answers', { session_id: sessionId }), {}, { questionId, valeur, estCorrecte, autoPass, tempsMs });
}

/**
 * Finalise la session
 * @param {string} session_id
 * @param {object} scores
 * @returns {Promise<{data, error, status}>}
 */
export async function finalizeSession(session_id, scores) {
  return await api.post(api.buildUrl('/api/v1/tests/sessions/:session_id/finaliser', { session_id }), {}, scores);
}

/**
 * Récupère toutes les sessions (avec filtres)
 * @param {object} filters
 * @returns {Promise<{data, error, status}>}
 */
export async function getAllSessions(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return await api.get(`/api/v1/tests/sessions${params ? '?' + params : ''}`);
}

/**
 * Récupère une session avec ses réponses
 * @param {string} sessionId
 * @returns {Promise<{data, error, status}>}
 */
export async function getSessionWithAnswers(sessionId) {
  return await api.get(api.buildUrl('/api/v1/tests/sessions/:session_id', { session_id: sessionId }));
}

