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

    // Masquer les loading-state
    document.querySelectorAll('.loading-state').forEach(el => el.style.display = 'none');

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
