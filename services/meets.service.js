import { api } from './api.service.js';

/**
 * Récupère tous les meets avec filtres
 * @param {object} filters
 * @returns {Promise<{data, error, status}>}
 */
export async function getAllMeets(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return await api.get(`/api/v1/meets/${params ? '?' + params : ''}`);
}

/**
 * Récupère un meet par ID
 * @param {string} id
 * @returns {Promise<{data, error, status}>}
 */
export async function getMeetById(meet_id) {
  return await api.get(api.buildUrl('/api/v1/meets/:meet_id', { meet_id }));
}

/**
 * Crée un meet
 * @param {object} data
 * @returns {Promise<{data, error, status}>}
 */
export async function createMeet(data) {
  return await api.post('/api/v1/meets/', {}, data);
}

/**
 * Met à jour un meet
 * @param {string} id
 * @param {object} data
 * @returns {Promise<{data, error, status}>}
 */
export async function updateMeet(meet_id, data) {
  return await api.patch(api.buildUrl('/api/v1/meets/:meet_id', { meet_id }), {}, data);
}

/**
 * Enregistre une décision sur un meet
 * @param {string} id
 * @param {string} decision
 * @returns {Promise<{data, error, status}>}
 */
export async function recordDecision(meet_id, decision) {
  return await api.patch(api.buildUrl('/api/v1/meets/:meet_id', { meet_id }), {}, { decision });
}
