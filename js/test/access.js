import { qs } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';
import API_CONFIG from '../../config/api.config.js';

document.addEventListener('DOMContentLoaded', async () => {

  const stateLoading = qs('#state-loading');
  const stateValid   = qs('#state-valid');
  const stateInvalid = qs('#state-invalid');
  const invalidReason = qs('#invalid-reason');

  function showState(state) {
    stateLoading.style.display = 'none';
    stateValid.style.display   = 'none';
    stateInvalid.style.display = 'none';
    if (state === 'loading') stateLoading.style.display = '';
    if (state === 'valid')   stateValid.style.display   = '';
    if (state === 'invalid') stateInvalid.style.display = '';
  }

  function showInvalid(reason) {
    if (invalidReason) invalidReason.textContent = reason;
    showState('invalid');
  }

  // Récupérer le token depuis l'URL
  const params = new URLSearchParams(window.location.search);
  const uuid   = params.get('token');

  if (!uuid) {
    showInvalid('Aucun token trouvé dans l\'URL. Vérifie le lien reçu par email.');
    return;
  }

  showState('loading');

  try {
    // Démarrer la session via l'API
    const res = await fetch(
      API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SESSION_DEMARRER,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_uuid: uuid }),
      }
    );

    const data = await res.json();
    console.log('[access] SESSION_DEMARRER réponse →', data);

    if (!res.ok) {
      const detail = data?.detail || 'Lien invalide ou expiré.';
      showInvalid(detail);
      return;
    }

    // Session démarrée avec succès
    const session   = data?.data ?? data;
    const candidat  = session?.candidat ?? {};
    const sessionId = session?.id || session?.session_id;
    const pole      = session?.pole || candidat?.pole || '—';
    const prenom    = candidat?.prenom || '';
    const nom       = candidat?.nom   || '';

    // Stocker en sessionStorage pour exam.html
    sessionStorage.setItem('tp_test_token',    uuid);
    sessionStorage.setItem('tp_session_id',    sessionId || '');
    sessionStorage.setItem('tp_pole', pole);
    sessionStorage.setItem('tp_candidat_pole', pole);
    sessionStorage.setItem('tp_candidat_nom',  `${prenom} ${nom}`.trim());

    // Remplir la carte candidat
    const candCard = qs('#cand-card');
    if (candCard) {
      candCard.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:50%;
            background:var(--accent,#6c63ff);color:#fff;
            display:flex;align-items:center;justify-content:center;
            font-size:18px;font-weight:700;flex-shrink:0;">
            ${prenom.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div style="font-weight:700;font-size:15px;">
              ${prenom} ${nom}
            </div>
            <div style="font-size:12px;opacity:.6;margin-top:2px;">
              Pôle ${pole} · Session 2026
            </div>
          </div>
        </div>`;
    }

    // Remplir les infos du test
    const partsEl = qs('#access-parts-loading');
    if (partsEl) {
      partsEl.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);
          gap:10px;margin-bottom:4px;">
          <div style="text-align:center;padding:12px;
            background:var(--surface,#f5f5f0);border-radius:8px;">
            <div style="font-size:20px;font-weight:800;">9</div>
            <div style="font-size:11px;opacity:.6;margin-top:2px;">Questions</div>
          </div>
          <div style="text-align:center;padding:12px;
            background:var(--surface,#f5f5f0);border-radius:8px;">
            <div style="font-size:20px;font-weight:800;">~15</div>
            <div style="font-size:11px;opacity:.6;margin-top:2px;">Minutes</div>
          </div>
          <div style="text-align:center;padding:12px;
            background:var(--surface,#f5f5f0);border-radius:8px;">
            <div style="font-size:20px;font-weight:800;">1</div>
            <div style="font-size:11px;opacity:.6;margin-top:2px;">Tentative</div>
          </div>
        </div>`;
    }

    // Remplir la checklist
    const checksEl = qs('#access-checks');
    if (checksEl) {
      checksEl.innerHTML = `
        <div style="font-size:13px;font-weight:600;margin-bottom:10px;">
          Avant de commencer :
        </div>
        ${[
          'Assure-toi d\'avoir du temps devant toi (15–20 min)',
          'Ne quitte pas la page — le lien sera verrouillé',
          'Pas de retour arrière entre les questions',
          'Réponds honnêtement — c\'est éliminatoire',
        ].map(item => `
          <div style="display:flex;align-items:flex-start;gap:8px;
            margin-bottom:8px;font-size:13px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" 
              viewBox="0 0 24 24" fill="none" stroke="currentColor" 
              stroke-width="2.5" style="flex-shrink:0;margin-top:1px;
              color:var(--accent,#6c63ff);">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            ${item}
          </div>`).join('')}`;
    }

    // Activer le bouton démarrer
    const startBtn = qs('#start-test-btn');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.addEventListener('click', () => {
        window.location.href = 'exam.html';
      });
    }

    showState('valid');

  } catch(e) {
    console.error('[access] erreur', e);
    showInvalid('Erreur réseau. Vérifie ta connexion et réessaie.');
  }
});
