import { requireAdmin, getAdminName, setAdminName, clearSession } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getMe } from '../../services/admins.service.js';
import { getAllCandidates } from '../../services/candidates.service.js';
import { getAllSessions } from '../../services/sessions.service.js';
import { getAllMeets } from '../../services/meets.service.js';
import { getAllMembers } from '../../services/members.service.js';
import { qs } from '../../utils/dom.utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  requireAdmin();
  initProfilModal();

  // Affiche le nom de l'admin dans le sidebar
  let adminName = getAdminName();
  if (!adminName) {
    // Récupère le profil si on a un token mais pas de nom stocké (reload après login)
    try {
      const { data } = await getMe();
      const admin = data?.admin || {};
      adminName = [admin?.prenom, admin?.nom].filter(Boolean).join(' ').trim() || admin?.nom || admin?.prenom || data?.nom || '';
      if (adminName) setAdminName(adminName);
    } catch (err) {
      console.warn('[dashboard] impossible de récupérer le profil admin', err);
    }
  }

  const sidebarName = qs('#sidebar-user-name');
  const sidebarAvatar = qs('#sidebar-avatar');
  if (adminName) {
    if (sidebarName) sidebarName.textContent = adminName;
    if (sidebarAvatar) sidebarAvatar.textContent = adminName.charAt(0).toUpperCase();
  }

  const statsEls = {
    candidatures: qs('#stat-candidatures'),
    tests: qs('#stat-tests'),
    meets: qs('#stat-meets'),
    membres: qs('#stat-membres'),
  };
  const recentTable = qs('#recent-candidates-tbody');
  // Affiche loading
  Object.values(statsEls).forEach(el => { if (el) el.textContent = '…'; });
  if (recentTable) recentTable.innerHTML = '<tr><td colspan="6">Chargement…</td></tr>';

  // Nettoyer les loading-state dès que le chargement commence
  document.querySelectorAll('.loading-state').forEach(el => {
    el.classList.remove('loading-state');
  });

  try {
    const [cands, sess, meets, membres] = await Promise.all([
      getAllCandidates(),
      getAllSessions(),
      getAllMeets(),
      getAllMembers()
    ]);

    // Normalise la liste quelle que soit la structure retournée
    const candidatesList = Array.isArray(cands.data) ? cands.data
      : Array.isArray(cands.data?.candidates) ? cands.data.candidates
      : Array.isArray(cands.data?.results) ? cands.data.results
      : [];

    const sessionsList = Array.isArray(sess.data) ? sess.data
      : Array.isArray(sess.data?.sessions) ? sess.data.sessions
      : Array.isArray(sess.data?.results) ? sess.data.results
      : [];

    const meetsList = Array.isArray(meets.data) ? meets.data
      : Array.isArray(meets.data?.meets) ? meets.data.meets
      : Array.isArray(meets.data?.results) ? meets.data.results
      : [];

    const membresList = Array.isArray(membres.data) ? membres.data
      : Array.isArray(membres.data?.membres) ? membres.data.membres
      : Array.isArray(membres.data?.results) ? membres.data.results
      : [];

    // Stats
    if (statsEls.candidatures) statsEls.candidatures.textContent = candidatesList.length;
    if (statsEls.tests)        statsEls.tests.textContent        = sessionsList.length;
    if (statsEls.meets)        statsEls.meets.textContent        = meetsList.length;
    if (statsEls.membres)      statsEls.membres.textContent      = membresList.length;

    // ── Pipeline ──────────────────────────────────────────
    const totalCands = candidatesList.length || 1;
    const pipeSteps  = document.querySelectorAll('.pipeline-step');

    if (pipeSteps[0]) {
      const c = pipeSteps[0].querySelector('.pipeline-step-count');
      const f = pipeSteps[0].querySelector('.pipeline-step-fill');
      const m = pipeSteps[0].querySelector('.pipeline-step-meta');
      if (c) c.textContent = candidatesList.length;
      if (f) f.style.width = '100%';
      if (m) m.textContent = 'Total des candidatures reçues';
    }

    const testsCount = candidatesList.filter(c =>
      ['test_envoye','test_valide','test_complete','meet_planifie','membre']
        .includes((c.statut||'').toLowerCase())
    ).length;
    if (pipeSteps[1]) {
      const c = pipeSteps[1].querySelector('.pipeline-step-count');
      const f = pipeSteps[1].querySelector('.pipeline-step-fill');
      const m = pipeSteps[1].querySelector('.pipeline-step-meta');
      if (c) c.textContent = testsCount;
      if (f) f.style.width = Math.round((testsCount / totalCands) * 100) + '%';
      if (m) m.textContent = Math.round((testsCount / totalCands) * 100) + '% des candidats';
    }

    if (pipeSteps[2]) {
      const c = pipeSteps[2].querySelector('.pipeline-step-count');
      const f = pipeSteps[2].querySelector('.pipeline-step-fill');
      const m = pipeSteps[2].querySelector('.pipeline-step-meta');
      if (c) c.textContent = meetsList.length;
      if (f) f.style.width = Math.round((meetsList.length / totalCands) * 100) + '%';
      if (m) m.textContent = Math.round((meetsList.length / totalCands) * 100) + '% des candidats';
    }

    // ── Répartition par pôle ──────────────────────────────
    const total    = candidatesList.length || 1;
    const byPole   = { dev: 0, secu: 0, iot: 0 };
    const byNiveau = { 'L1-L2': 0, 'L3-M1': 0, 'M2': 0 };

    candidatesList.forEach(c => {
      const p = (c.pole || '').toLowerCase();
      if (p === 'dev')  byPole.dev++;
      if (p === 'secu') byPole.secu++;
      if (p === 'iot')  byPole.iot++;
      const n = (c.niveau || '').toUpperCase();
      if (n === 'L1' || n === 'L2')        byNiveau['L1-L2']++;
      else if (n === 'L3' || n === 'M1')   byNiveau['L3-M1']++;
      else if (n === 'M2')                 byNiveau['M2']++;
    });

    console.log('[dashboard] byPole →', byPole);
    console.log('[dashboard] byNiveau →', byNiveau);

    const barRows = document.querySelectorAll('.bar-row');
    console.log('[dashboard] barRows →', barRows.length);

    [byPole.dev, byPole.secu, byPole.iot].forEach((val, i) => {
      if (!barRows[i]) return;
      const f = barRows[i].querySelector('.bar-fill');
      const n = barRows[i].querySelector('.bar-num');
      if (f) f.style.width = Math.round((val / total) * 100) + '%';
      if (n) { n.textContent = val; n.classList.remove('loading-state'); n.style.removeProperty('display'); }
    });

    [byNiveau['L1-L2'], byNiveau['L3-M1'], byNiveau['M2']].forEach((val, i) => {
      if (!barRows[i + 3]) return;
      const f = barRows[i + 3].querySelector('.bar-fill');
      const n = barRows[i + 3].querySelector('.bar-num');
      if (f) f.style.width = Math.round((val / total) * 100) + '%';
      if (n) { n.textContent = val; n.classList.remove('loading-state'); n.style.removeProperty('display'); }
    });

    const chartTag = document.querySelector('.chart-box .tag');
    if (chartTag) { chartTag.textContent = total + ' candidats'; chartTag.classList.remove('loading-state'); }

    // Masquer les loading-state restants
    document.querySelectorAll('.loading-state').forEach(el => {
      el.classList.remove('loading-state');
    });

    // Tableau des 5 dernières candidatures
    if (recentTable && candidatesList.length > 0) {
      recentTable.innerHTML = '';
      candidatesList.slice(-5).reverse().forEach(c => {
        const date = c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '—';
        recentTable.innerHTML += `<tr>
  <td>${c.prenom ?? ''} ${c.nom ?? ''}</td>
  <td>${c.pole ?? '—'}</td>
  <td>${c.niveau ?? '—'}</td>
  <td>${date}</td>
  <td><span class="tag">${c.statut ?? '—'}</span></td>
  <td><a href="candidatures.html" class="btn btn-ghost btn-sm">Voir</a></td>
</tr>`;
      });
    } else if (recentTable) {
      recentTable.innerHTML = '<tr><td colspan="6">Aucune candidature pour le moment.</td></tr>';
    }
  } catch (e) {
    console.error('[dashboard] erreur chargement', e);
    Object.values(statsEls).forEach(el => { if (el) el.textContent = '—'; });
    if (recentTable) recentTable.innerHTML = '<tr><td colspan="6">Erreur de chargement</td></tr>';
  }
});

