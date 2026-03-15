import { api } from './api.service.js';

/**
 * Récupère tous les membres avec filtres
 * @param {object} filters
 * @returns {Promise<{data, error, status}>}
 */
export async function getAllMembers(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return await api.get(`/api/v1/members/${params ? '?' + params : ''}`);
}

/**
 * Récupère un membre par ID
 * @param {string} id
 * @returns {Promise<{data, error, status}>}
 */
export async function getMemberById(membre_id) {
  return await api.get(api.buildUrl('/api/v1/members/:membre_id', { membre_id }));
}

/**
 * Crée un membre
 * @param {object} data
 * @returns {Promise<{data, error, status}>}
 */
export async function createMember(data) {
  return await api.post('/api/v1/members/', {}, data);
}

/**
 * Désactive un membre
 * @param {string} id
 * @returns {Promise<{data, error, status}>}
 */
export async function deactivateMember(membre_id) {
  return await api.patch(api.buildUrl('/api/v1/members/:membre_id', { membre_id }), {}, { actif: false });
}
