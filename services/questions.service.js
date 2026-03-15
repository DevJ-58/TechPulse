import { api } from './api.service.js';

/**
 * Récupère les questions par pôle
 * @param {string} pole
 * @returns {Promise<{data, error, status}>}
 */
  return await api.get(api.buildUrl('/api/v1/questions/', { pole }));


/**
 * Récupère toutes les questions
 * @returns {Promise<{data, error, status}>}
 */
  return await api.get('/api/v1/questions/');


/**
 * Crée une question
 * @param {object} data
 * @returns {Promise<{data, error, status}>}
 */
  return await api.post('/api/v1/questions/', {}, data);


/**
 * Met à jour une question
 * @param {string} id
 * @param {object} data
 * @returns {Promise<{data, error, status}>}
 */
  return await api.patch(api.buildUrl('/api/v1/questions/:question_id', { question_id: id }), {}, data);


/**
 * Supprime une question
 * @param {string} id
 * @returns {Promise<{data, error, status}>}
 */
  return await api.delete(api.buildUrl('/api/v1/questions/:question_id', { question_id: id }));


/**
 * Récupère les choix d'une question
 * @param {string} questionId
 * @returns {Promise<{data, error, status}>}
 */
  return await api.get(api.buildUrl('/api/v1/questions/:question_id/choices', { question_id: questionId }));

/**
 * Crée un choix pour une question
 * @param {string} questionId
 * @param {object} data
 * @returns {Promise<{data, error, status}>}
 */
export async function createChoice(question_id, data) {
  return await api.post(api.buildUrl('/api/v1/questions/:question_id/choices', { question_id }), {}, data);
}

/**
 * Met à jour un choix
 * @param {string} questionId
 * @param {string} choiceId
 * @param {object} data
 * @returns {Promise<{data, error, status}>}
 */
export async function updateChoice(question_id, choice_id, data) {
  return await api.patch(api.buildUrl('/api/v1/questions/:question_id/choices/:choice_id', { question_id, choice_id }), {}, data);
}

/**
 * Supprime un choix
 * @param {string} questionId
 * @param {string} choiceId
 * @returns {Promise<{data, error, status}>}
 */
export async function deleteChoice(question_id, choice_id) {
  return await api.delete(api.buildUrl('/api/v1/questions/:question_id/choices/:choice_id', { question_id, choice_id }));
}
