import { api } from './api.service.js';
import API_CONFIG from '../config/api.config.js';

/**
 * Récupère tous les membres avec filtres
 * @param {object} filters
 * @returns {Promise<{data, error, status}>}
 */
export async function getAllMembers(filters = {}) {
  return await api.get(API_CONFIG.ENDPOINTS.MEMBERS, filters);
}

/**
 * Récupère un membre par ID
 * @param {string} id
 * @returns {Promise<{data, error, status}>}
 */
export async function getMemberById(membre_id) {
  return await api.get(API_CONFIG.ENDPOINTS.MEMBER_BY_ID.replace(':membre_id', membre_id));
}

/**
 * Crée un membre
 * @param {object} data
 * @returns {Promise<{data, error, status}>}
 */
export async function createMember(data) {
  return await api.post(API_CONFIG.ENDPOINTS.MEMBERS, {}, data);
}

/**
 * Désactive un membre
 * @param {string} id
 * @returns {Promise<{data, error, status}>}
 */
export async function deactivateMember(membre_id) {
  return await api.patch(API_CONFIG.ENDPOINTS.MEMBER_BY_ID.replace(':membre_id', membre_id), {}, { actif: false });
}
