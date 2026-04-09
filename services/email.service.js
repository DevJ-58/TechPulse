import { api } from './api.service.js';
import API_CONFIG from '../config/api.config.js';

/**
 * Envoie un lien de test par email à un candidat
 * @param {string} candidat_id
 * @param {string} token_uuid
 * @returns {Promise<{data, error, status}>}
 */
export async function sendTestLink(candidat_id, token_uuid) {
  try {
    return await api.post(API_CONFIG.ENDPOINTS.EMAIL_TEST_LINK || '/api/v1/email/send-test-link', {}, { 
      candidat_id, token_uuid 
    });
  } catch(e) {
    console.warn('[sendTestLink] endpoint non disponible', e);
    return { data: null, error: null }; // non bloquant
  }
}

/**
 * Envoie une notification de refus à un candidat
 * @param {string} candidat_id
 * @returns {Promise<{data, error, status}>}
 */
export async function sendRefusal(candidat_id, message_perso = '') {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.EMAIL_REFUSAL, {}, { 
        candidat_id,
        message_perso
      });
    } catch(e) {
      console.warn('[sendRefusal] endpoint non disponible', e);
      return { data: null, error: null };
  }
}

/**
 * Envoie une invitation de meet
 * @param {string} meet_id
 * @param {string} email
 * @returns {Promise<{data, error, status}>}
 */
export async function sendMeetInvitation(meet_id, email) {
  return await api.post('/api/v1/email/send-meet-invitation', {}, { meet_id, email });
}

/**
 * Envoie une notification d'admission
 * @param {string} candidat_id
 * @param {string} email
 * @returns {Promise<{data, error, status}>}
 */
export async function sendAdmission(candidat_id, email) {
  return await api.post('/api/v1/email/send-admission', {}, { candidat_id, email });
}

/**
 * Envoie les résultats du test
 * @param {string} session_id
 * @param {string} email
 * @returns {Promise<{data, error, status}>}
 */
export async function sendTestResult(session_id, email) {
  return await api.post('/api/v1/email/send-test-result', {}, { session_id, email });
}

