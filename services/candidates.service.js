import { api } from './api.service.js';

/**
 * Récupère tous les candidats avec filtres optionnels
 * @param {object} filters
 * @returns {Promise<{data, error, status}>}
 */
export async function getAllCandidates(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return await api.get(`/api/v1/candidates/${params ? '?' + params : ''}`);
}

/**
 * Récupère un candidat par ID
 * @param {string} id
 * @returns {Promise<{data, error, status}>}
 */
export async function getCandidateById(candidat_id) {
  return await api.get(api.buildUrl('/api/v1/candidates/:candidat_id', { candidat_id }));
}

/**
 * Crée un nouveau candidat
 * @param {object} data
 * @returns {Promise<{data, error, status}>}
 */
export async function createCandidate(data) {
  return await api.post('/api/v1/candidates/', {}, data);
}

/**
 * Met à jour le statut d'un candidat
 * @param {string} id
 * @param {string} statut
 * @returns {Promise<{data, error, status}>}
 */
export async function updateCandidateStatus(candidat_id, statut) {
  return await api.patch(api.buildUrl('/api/v1/candidates/:candidat_id/statut', { candidat_id }), {}, { statut });
}

/**
 * Supprime un candidat
 * @param {string} id
 * @returns {Promise<{data, error, status}>}
 */
export async function deleteCandidate(candidat_id) {
  return await api.delete(api.buildUrl('/api/v1/candidates/:candidat_id', { candidat_id }));
}
