import { api } from './api.service.js';
import API_CONFIG from '../config/api.config.js';

/**
 * Récupère tous les candidats avec filtres optionnels
 * @param {object} filters
 * @returns {Promise<{data, error, status}>}
 */
export async function getAllCandidates(filters = {}) {
  return await api.get(API_CONFIG.ENDPOINTS.CANDIDATES, filters);
}

/**
 * Récupère un candidat par ID
 * @param {string} id
 * @returns {Promise<{data, error, status}>}
 */
export async function getCandidateById(candidat_id) {
  const url = API_CONFIG.ENDPOINTS.CANDIDATE_BY_ID.replace(':candidat_id', candidat_id);
  return await api.get(url);
}

/**
 * Crée un nouveau candidat
 * @param {object} data
 * @returns {Promise<{data, error, status}>}
 */
export async function createCandidate(data) {
  return await api.post(API_CONFIG.ENDPOINTS.CANDIDATES, {}, data);
}

/**
 * Met à jour le statut d'un candidat
 * @param {string} id
 * @param {string} statut
 * @returns {Promise<{data, error, status}>}
 */
export async function updateCandidateStatus(candidat_id, statut) {
  const url = API_CONFIG.ENDPOINTS.CANDIDATE_STATUT.replace(':candidat_id', candidat_id);
  return await api.patch(url, {}, { statut });
}

/**
 * Supprime un candidat
 * @param {string} id
 * @returns {Promise<{data, error, status}>}
 */
export async function deleteCandidate(candidat_id) {
  const url = API_CONFIG.ENDPOINTS.CANDIDATE_BY_ID
    .replace(':candidat_id', candidat_id);
  console.log('[deleteCandidate] DELETE →', url);
  return await api.delete(url);
}

