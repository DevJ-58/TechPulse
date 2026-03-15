import { verifyToken } from '../../services/tokens.service.js';
import { qs, setLoading } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const uuid = params.get('token');
  const stateEl = qs('.access-state');
  if (!uuid) {
    if (stateEl) stateEl.textContent = 'Token manquant dans l’URL.';
    return;
  }
  if (stateEl) stateEl.textContent = 'Chargement…';
  const { data, error } = await verifyToken(uuid);
  if (error) {
    stateEl.textContent = 'Erreur réseau ou token invalide.';
    return;
  }
  if (data.valid) {
    stateEl.textContent = `Token valide pour ${data.candidate?.prenom || ''} (${data.candidate?.pole || ''})`;
    // bouton commencer
    const btn = qs('.btn-commencer');
    if (btn) {
      btn.disabled = false;
      btn.addEventListener('click', () => {
        sessionStorage.setItem('tp_test_token', uuid);
        sessionStorage.setItem('tp_candidate_id', data.candidate?.id || '');
        window.location.href = 'exam.html';
      });
    }
  } else if (data.expired) {
    stateEl.textContent = 'Ce lien a expiré.';
  } else if (data.used || data.locked) {
    stateEl.textContent = 'Ce lien a déjà été utilisé ou est verrouillé.';
  } else {
    stateEl.textContent = 'Token invalide.';
  }
});
