import { verifyToken, lockToken } from '../../services/tokens.service.js';
import { getQuestionsByPole } from '../../services/questions.service.js';
import { createSession, submitAnswer, submitSession } from '../../services/sessions.service.js';
import { qs, qsa, setLoading } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const uuid = sessionStorage.getItem('tp_test_token');
  const candidateId = sessionStorage.getItem('tp_candidate_id');
  if (!uuid || !candidateId) {
    window.location.href = 'access.html';
    return;
  }
  // Re-vérifie le token
  const { data: tokenData, error: tokenError } = await verifyToken(uuid);
  if (!tokenData?.valid) {
    showToast('Token invalide ou expiré', 'error');
    window.location.href = 'access.html';
    return;
  }
  // TODO: charger questions, créer session, gérer réponses, soumission, abandon, etc.
  // Abandon (visibilitychange)
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
      await lockToken(uuid, 'abandoned');
    }
  });
});
