import { api } from './api.service.js';

/**
 * Récupère les paramètres globaux
 * @returns {Promise<{data, error, status}>}
 */
export async function getSettings() {
  return await api.get('/api/v1/settings/global');
}

/**
 * Met à jour les paramètres globaux
 * @param {object} data
 * @returns {Promise<{data, error, status}>}
 */
export async function updateSettings(data) {
  return await api.patch('/api/v1/settings/global', {}, data);
}
