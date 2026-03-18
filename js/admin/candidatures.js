import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getAllCandidates, getCandidateById, updateCandidateStatus, deleteCandidate } from '../../services/candidates.service.js';
import { createToken } from '../../services/tokens.service.js';
import { sendTestLink, sendRefusal } from '../../services/email.service.js';
import { qs, qsa, show, hide } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

console.log('candidatures.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  initProfilModal();
  const adminName = getAdminName();
  if (adminName) {
    const nameEl = qs('.sidebar-user-name');
    if (nameEl) nameEl.textContent = adminName;
  }


  // Burger menu functionality
  const burger = qs('#topbar-burger');
  const sidebar = qs('#sidebar');
  const overlay = qs('.sidebar-overlay');

  if (burger && sidebar) {
    burger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('show');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  function formatDate(val) {
    if (!val) return '—';
    // Timestamp Firestore : { _seconds: 1234, _nanoseconds: 0 }
    if (val?._seconds) return new Date(val._seconds * 1000).toLocaleDateString('fr-FR');
    // String ISO ou timestamp numérique
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
  }

  // ── Données et variables filtres ──────────────────────────
  let _allCandidats = [];
  let _filtreStatut = 'tous';
  let _filtrePole   = 'tous';
  let _recherche    = '';

  // ── Helpers statut ──────────────────────────────────────────
  function statutClass(s) {
    const map = {
      en_attente:  'tag-warning',
      test_envoye: 'tag-default',
      meet:        'tag-accent',
      admis:       'tag-success',
      refuse:      'tag-danger',
    };
    return map[s] || 'tag-default';
  }

  function statutLabel(s) {
    const map = {
      en_attente:  'En attente',
      test_envoye: 'Test envoyé',
      meet:        'Meet',
      admis:       'Admis',
      refuse:      'Refusé',
    };
    return map[s] || s || '—';
  }

  // ── Fonction de rendu ──────────────────────────────────────
  function renderTable(list) {
    const tb = qs('#cand-table-tbody') || tbody;
    if (!tb) return;
    tb.innerHTML = '';
    if (!list.length) {
      tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);">Aucun candidat trouvé</td></tr>';
      return;
    }
    list.forEach(c => {
      const date = formatDate(c.date_candidature || c.created_at);
      tb.innerHTML += `<tr>
        <td>${c.prenom || ''} ${c.nom || ''}</td>
        <td>${c.pole || '—'}</td>
        <td>${c.niveau || '—'}</td>
        <td>${date}</td>
        <td><span class="tag ${statutClass(c.statut)}">${statutLabel(c.statut)}</span></td>
        <td style="display:flex;gap:6px;align-items:center;">
          <button class="btn btn-ghost btn-icon btn-sm" title="Voir"
            onclick="openPanel('${c.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          ${c.statut === 'en_attente' ? `
          <button class="btn btn-ghost btn-icon btn-sm" title="Envoyer le test"
            onclick="ouvrirModalTest('${c.id}','${c.prenom} ${c.nom}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </button>` : ''}
          ${(c.statut === 'en_attente' || c.statut === 'test_envoye') ? `
          <button class="btn btn-ghost btn-icon btn-sm" title="Refuser"
            style="color:var(--danger);"
            onclick="ouvrirModalRefus('${c.id}','${c.prenom} ${c.nom}','${c.email}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </button>` : ''}
          ${(c.statut === 'refuse' || !c.statut) ? `
          <button class="btn btn-ghost btn-icon btn-sm" title="Supprimer"
            style="color:var(--danger);"
            onclick="supprimerCandidat('${c.id}','${c.prenom} ${c.nom}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>` : ''}
          ${c.statut === 'admis' ? `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="var(--success)" stroke-width="2" title="Admis">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>` : ''}
        </td>
      </tr>`;
    });
    const topbarTag = qs('.topbar-actions .tag');
    if (topbarTag) topbarTag.textContent = 
      `${list.length} candidature${list.length > 1 ? 's' : ''}`;
  }

  // ── Appliquer filtres et recherche ──────────────────────────
  function appliquerFiltres() {
    let liste = [..._allCandidats];
    if (_filtreStatut !== 'tous') {
      liste = liste.filter(c => c.statut === _filtreStatut);
    }
    if (_filtrePole !== 'tous') {
      liste = liste.filter(c => c.pole === _filtrePole);
    }
    if (_recherche.trim()) {
      const q = _recherche.toLowerCase();
      liste = liste.filter(c =>
        (c.prenom + ' ' + c.nom).toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.pole  || '').toLowerCase().includes(q)
      );
    }
    renderTable(liste);
  }

  // Charger les candidats
  const tbody = qs('#cand-table-tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="6">Chargement…</td></tr>';
    (async () => {
      try {
        const { data, error, status } = await getAllCandidates();
        console.log('[candidatures] getAllCandidates', { status, error, data });
        if (error) {
          // Show detailed error message
          const errorMsg = error.includes('CORS') 
            ? 'Erreur serveur : Le backend a retourné une erreur (vérifiez les logs Render)'
            : 'Erreur de chargement des candidats';
          tbody.innerHTML = `<tr><td colspan="6">${errorMsg}</td></tr>`;
          showToast(errorMsg, 'error');
          return;
        }
        if (data && Array.isArray(data)) {
          _allCandidats = data;
          renderTable(_allCandidats);
        }
      } catch (e) {
        console.error('[candidatures] erreur', e);
        const errorMsg = e.message.includes('Failed to fetch') 
          ? 'Impossible de se connecter au serveur (vérifiez les logs Render)'
          : 'Erreur lors du chargement des candidats';
        tbody.innerHTML = `<tr><td colspan="6">${errorMsg}</td></tr>`;
        showToast(errorMsg, 'error');
      }
    })();
  }

  // ── Event listeners filtres ─────────────────────────────────
  const searchInput = qs('.search-box input');
  if (searchInput) {
    searchInput.removeAttribute('oninput');
    searchInput.addEventListener('input', e => {
      _recherche = e.target.value;
      appliquerFiltres();
    });
  }

  // Filtres statut
  const statutValues = ['tous','en_attente','test_envoye','meet','admis','refuse'];
  document.querySelectorAll('.filter-bar:nth-child(2) .filter-btn')
    .forEach((btn, i) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-bar:nth-child(2) .filter-btn')
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _filtreStatut = statutValues[i] ?? 'tous';
        appliquerFiltres();
      });
    });

  // Filtres pôle
  const poleValues = ['tous','dev','secu','iot'];
  document.querySelectorAll('.filter-bar:nth-child(3) .filter-btn')
    .forEach((btn, i) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-bar:nth-child(3) .filter-btn')
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _filtrePole = poleValues[i] ?? 'tous';
        appliquerFiltres();
      });
    });

  // ── Panel détail ──────────────────────────────────────────
  const detOverlay = qs('#det-overlay');
  const detPanel   = qs('#det-panel');
  const pName      = qs('#p-name');
  const pBody      = qs('#p-body');
  const pFooter    = qs('#p-footer');

  window.closePanel = () => {
    detPanel?.classList.remove('open');
    detOverlay?.classList.remove('show');
  };

  window.openPanel = async (candidatId) => {
    if (!detPanel || !pBody) return;
    pName.textContent = 'Chargement…';
    pBody.innerHTML   = '<div class="loading-state">Chargement…</div>';
    pFooter.innerHTML = '';
    detPanel.classList.add('open');
    detOverlay?.classList.add('show');

    try {
      const { data, error } = await getCandidateById(candidatId);
      const c = data ?? {};
      if (error || !c.id) {
        pBody.innerHTML = '<p style="color:var(--danger);">Erreur de chargement.</p>';
        return;
      }

      pName.textContent = `${c.prenom || ''} ${c.nom || ''}`.trim() || '—';

      const date = formatDate(c.date_candidature || c.created_at);

      const statutColors = {
        en_attente:   'tag-warning',
        test_envoye:  'tag-default',
        meet:         'tag-accent',
        admis:        'tag-success',
        refuse:       'tag-danger',
      };
      const tagClass = statutColors[c.statut] || 'tag-default';

      pBody.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span class="tag ${tagClass}">${c.statut || '—'}</span>
            <span style="font-size:12px;color:var(--muted);">${date}</span>
          </div>
          <hr style="border:none;border-top:1px solid var(--border);">
          <div><span style="font-size:11px;color:var(--muted);text-transform:uppercase;">Email</span><div style="font-size:13px;margin-top:2px;">${c.email || '—'}</div></div>
          <div><span style="font-size:11px;color:var(--muted);text-transform:uppercase;">Téléphone</span><div style="font-size:13px;margin-top:2px;">${c.tel || '—'}</div></div>
          <div><span style="font-size:11px;color:var(--muted);text-transform:uppercase;">Pôle</span><div style="font-size:13px;margin-top:2px;">${c.pole || '—'}</div></div>
          <div><span style="font-size:11px;color:var(--muted);text-transform:uppercase;">Niveau</span><div style="font-size:13px;margin-top:2px;">${c.niveau || '—'}</div></div>
          <div><span style="font-size:11px;color:var(--muted);text-transform:uppercase;">Filière</span><div style="font-size:13px;margin-top:2px;">${c.filiere || '—'}</div></div>
          <div><span style="font-size:11px;color:var(--muted);text-transform:uppercase;">Niveau technique</span><div style="font-size:13px;margin-top:2px;">${c.niveau_tech || '—'}</div></div>
          <hr style="border:none;border-top:1px solid var(--border);">
          <div><span style="font-size:11px;color:var(--muted);text-transform:uppercase;">Motivation</span><div style="font-size:13px;margin-top:4px;line-height:1.6;">${c.motivation || '—'}</div></div>
          ${c.projet_cite ? `<div><span style="font-size:11px;color:var(--muted);text-transform:uppercase;">Projet cité</span><div style="font-size:13px;margin-top:4px;">${c.projet_cite}</div></div>` : ''}
        </div>`;

      const statutActuel = c.statut;
      
      if (statutActuel === 'refuse') {
        pFooter.innerHTML = `
          <span style="font-size:12px;color:var(--danger);padding:8px 0;">
            ✕ Candidature refusée
          </span>`;
      } else if (statutActuel === 'admis') {
        pFooter.innerHTML = `
          <span style="font-size:12px;color:var(--success);padding:8px 0;">
            ✓ Candidat admis
          </span>`;
      } else if (statutActuel === 'test_envoye') {
        pFooter.innerHTML = `
          <span style="font-size:12px;color:var(--muted);padding:8px 0;">
            Test déjà envoyé
          </span>
          <button class="btn btn-outline btn-sm" onclick="ouvrirModalRefus('${c.id}','${c.prenom} ${c.nom}','${c.email}')">Refuser quand même</button>`;
      } else {
        pFooter.innerHTML = `
          <button class="btn btn-outline btn-sm" onclick="ouvrirModalRefus('${c.id}','${c.prenom} ${c.nom}','${c.email}')">Refuser</button>
          <button class="btn btn-primary btn-sm" onclick="ouvrirModalTest('${c.id}','${c.prenom} ${c.nom}')">Envoyer test →</button>`;
      }

    } catch (err) {
      console.error('[panel] erreur', err);
      pBody.innerHTML = '<p style="color:var(--danger);">Erreur inattendue.</p>';
    }
  };

  // ── Modal test ────────────────────────────────────────────
  const testModal    = qs('#test-modal');
  const modalCandName = qs('#modal-cand-name');
  let _currentCandId = null;

  window.ouvrirModalTest = (id, nom) => {
    console.log('[ouvrirModalTest]', { id, nom });
    _currentCandId = id;
    if (modalCandName) modalCandName.textContent = nom;
    const modal = qs('#test-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
  };

  window.closeModal = (modalId) => {
    const el = qs('#' + modalId);
    if (el) {
      el.style.display = 'none';
      el.classList.remove('show');
    }
  };

  // ── Modal refus ──────────────────────────────────────────
  const refusModal     = qs('#refus-modal');
  const modalRefusName = qs('#modal-refus-name');
  let _currentRefusId  = null;

  window.ouvrirModalRefus = (id, nom, email) => {
    console.log('[ouvrirModalRefus]', { id, nom, email });
    _currentRefusId = id;
    if (modalRefusName) modalRefusName.textContent = nom;
    if (refusModal) {
      refusModal.style.display = 'flex';
      refusModal.classList.add('show');
    }
  };

  window.confirmRefus = async () => {
    if (!_currentRefusId) { showToast('Aucun candidat sélectionné', 'error'); return; }

    const confirmBtn = qs('#refus-confirm-btn');
    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Envoi…'; }

    try {
      // 1. Changer le statut
      const { error: statutError } = await updateCandidateStatus(_currentRefusId, 'refuse');
      if (statutError) {
        showToast('Erreur statut : ' + statutError, 'error');
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Confirmer le refus & envoyer email'; }
        return;
      }

      // 2. Envoyer mail de refus
      const messagePerso = qs('#refus-message')?.value?.trim() || '';
      const { error: mailError } = await sendRefusal(_currentRefusId, messagePerso);
      console.log('[confirmRefus] mail refus →', { mailError });

      if (mailError) {
        showToast('Statut mis à jour mais erreur email : ' + mailError, 'warning');
      } else {
        showToast('Candidature refusée — email envoyé ✓');
      }

      closeModal('refus-modal');
      closePanel();
      setTimeout(() => location.reload(), 1200);

    } catch(e) {
      console.error('[confirmRefus] exception', e);
      showToast('Erreur inattendue : ' + e.message, 'error');
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Confirmer le refus & envoyer email'; }
    }
  };

  window.supprimerCandidat = async (id, nom) => {
    if (!id) return;

    const modal = document.createElement('div');
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.5);
      display:flex;align-items:center;justify-content:center;z-index:9999;`;
    modal.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);
        border-radius:var(--radius-lg);padding:24px;max-width:380px;width:90%;">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700;
          margin-bottom:8px;">Supprimer la candidature</div>
        <p style="font-size:13px;color:var(--muted);margin-bottom:20px;">
          Supprimer définitivement <strong>${nom}</strong> ? 
          Cette action est irréversible.
        </p>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn btn-outline btn-sm" id="cancel-delete">Annuler</button>
          <button class="btn btn-sm" id="confirm-delete"
            style="background:var(--danger);color:#fff;border:none;">
            Supprimer définitivement
          </button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    modal.querySelector('#cancel-delete').onclick = () => modal.remove();

    modal.querySelector('#confirm-delete').onclick = async () => {
      modal.querySelector('#confirm-delete').disabled = true;
      modal.querySelector('#confirm-delete').textContent = 'Suppression…';

      try {
        const { data, error, status } = await deleteCandidate(id);
        console.log('[supprimerCandidat] réponse →', JSON.stringify({ data, error, status }));
        if (error) {
          showToast('Erreur suppression : ' + error, 'error');
          modal.remove();
          return;
        }
        showToast('Candidat supprimé ✓');
        modal.remove();
        setTimeout(() => location.reload(), 800);
      } catch(e) {
        showToast('Erreur inattendue', 'error');
        modal.remove();
      }
    };
  };

  window.confirmSendTest = async () => {
    if (!_currentCandId) { showToast('Aucun candidat sélectionné', 'error'); return; }

    const confirmBtn = qs('#test-modal .btn-primary');
    if (confirmBtn) confirmBtn.disabled = true;

    try {
      // 1. Créer le token de test
      // Récupérer l'ID admin depuis le token JWT stocké
      let adminId = null;
      try {
        const rawToken = sessionStorage.getItem('tp_admin_token');
        if (rawToken) {
          const payload = JSON.parse(atob(rawToken.split('.')[1]));
          adminId = payload.sub || payload.id || payload.admin_id || payload.uid;
          console.log('[confirmSendTest] adminId extrait →', adminId);
        }
      } catch(e) {
        console.warn('[confirmSendTest] impossible de décoder le token JWT', e);
      }

      if (!adminId) {
        showToast('Session admin introuvable — reconnecte-toi', 'error');
        if (confirmBtn) confirmBtn.disabled = false;
        return;
      }

      const { data: tokenData, error: tokenError } = await createToken({
        candidat_id: _currentCandId,
        envoye_par_admin_id: adminId
      });
      console.log('[confirmSendTest] token →', { tokenData, tokenError });

      if (tokenError) {
        showToast('Erreur création token : ' + tokenError, 'error');
        if (confirmBtn) confirmBtn.disabled = false;
        return;
      }

      // 2. Changer le statut
      const { error: statutError } = await updateCandidateStatus(_currentCandId, 'test_envoye');
      if (statutError) {
        showToast('Erreur mise à jour statut : ' + statutError, 'error');
        if (confirmBtn) confirmBtn.disabled = false;
        return;
      }

      // 3. Envoyer le mail avec le lien
      const tokenUuid = tokenData?.token_uuid || tokenData?.uuid || tokenData?.id || tokenData?.token;
      console.log('[confirmSendTest] token_uuid extrait →', tokenUuid);

      const mailResult = await sendTestLink(_currentCandId, tokenUuid);
      console.log('[EMAIL COMPLET]', JSON.stringify(mailResult));
      console.log('[EMAIL token_uuid envoyé]', tokenUuid);
      console.log('[EMAIL candidat_id]', _currentCandId);
      const mailError = mailResult.error;
      console.log('[EMAIL DEBUG] candidat_id:', _currentCandId, 'token_uuid:', tokenUuid, 'mailError:', mailError);

      if (mailError) {
        showToast('Token créé mais erreur email : ' + mailError, 'warning');
      } else {
        showToast('Lien de test envoyé par email ✓');
      }

      closeModal('test-modal');
      closePanel();
      setTimeout(() => location.reload(), 1200);

    } catch(e) {
      console.error('[confirmSendTest] exception', e);
      showToast('Erreur inattendue : ' + e.message, 'error');
      if (confirmBtn) confirmBtn.disabled = false;
    }
  };

});
