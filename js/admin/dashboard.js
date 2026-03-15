import { requireAdmin } from '../../utils/auth.utils.js';
import { getAllCandidates } from '../../services/candidates.service.js';
import { getAllSessions } from '../../services/sessions.service.js';
import { getAllMeets } from '../../services/meets.service.js';
import { getAllMembers } from '../../services/members.service.js';
import { qs } from '../../utils/dom.utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  requireAdmin();

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

  const statsEls = {
    candidatures: qs('#stat-candidatures'),
    tests: qs('#stat-tests'),
    meets: qs('#stat-meets'),
    membres: qs('#stat-membres'),
  };
  const recentTable = qs('#recent-candidates-tbody');
  // Affiche loading
  Object.values(statsEls).forEach(el => { if (el) el.textContent = '…'; });
  if (recentTable) recentTable.innerHTML = '<tr><td colspan="5">Chargement…</td></tr>';
  try {
    const [cands, sess, meets, membres] = await Promise.all([
      getAllCandidates(),
      getAllSessions(),
      getAllMeets(),
      getAllMembers()
    ]);
    if (statsEls.candidatures) statsEls.candidatures.textContent = cands.data?.length ?? '0';
    if (statsEls.tests) statsEls.tests.textContent = sess.data?.length ?? '0';
    if (statsEls.meets) statsEls.meets.textContent = meets.data?.length ?? '0';
    if (statsEls.membres) statsEls.membres.textContent = membres.data?.length ?? '0';
    // 5 dernières candidatures
    if (recentTable && Array.isArray(cands.data)) {
      recentTable.innerHTML = '';
      cands.data.slice(-5).reverse().forEach(c => {
        recentTable.innerHTML += `<tr><td>${c.prenom}</td><td>${c.nom}</td><td>${c.pole}</td><td>${c.statut}</td><td>${c.email}</td></tr>`;
      });
    }
  } catch (e) {
    Object.values(statsEls).forEach(el => { if (el) el.textContent = '—'; });
    if (recentTable) recentTable.innerHTML = '<tr><td colspan="5">Erreur de chargement</td></tr>';
  }
});
