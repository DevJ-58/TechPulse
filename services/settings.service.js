  import { api } from './api.service.js';
  import API_CONFIG from '../config/api.config.js';

  /**
   * Récupère les paramètres globaux
   * @returns {Promise<{data, error, status}>}
   */
  export async function getSettings() {
    return await api.get(API_CONFIG.ENDPOINTS.SETTINGS_GLOBAL);
  }

  /**
   * Met à jour les paramètres globaux
   * @param {object} data
   * @returns {Promise<{data, error, status}>}
   */
  export async function updateSettings(data) {
    return await api.patch(API_CONFIG.ENDPOINTS.SETTINGS_GLOBAL, {}, data);
  }
