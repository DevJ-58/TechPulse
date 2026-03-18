import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getAllSessions, getSessionWithAnswers } from '../../services/sessions.service.js';
import { sendTestResult } from '../../services/email.service.js'; // TODO: endpoint à implémenter côté backend
import { qs, qsa } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  initProfilModal();

  // Afficher le nom de l'admin connecté
  const adminNameEl = qs('.sidebar-user-name');
  if (adminNameEl) {
    const adminName = getAdminName();
    adminNameEl.textContent = adminName || 'Admin';
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

  const resultsList = qs('#results-list');
  const statEnvoyes  = document.querySelector('.stat-card:nth-child(1) .stat-value');
  const statCompletes = document.querySelector('.stat-card:nth-child(2) .stat-value');
  const statScore    = document.querySelector('.stat-card:nth-child(3) .stat-value');
  const statAttente  = document.querySelector('.stat-card:nth-child(4) .stat-value');

  (async () => {
    try {
      const { data, error } = await getAllSessions();
      const sessions = Array.isArray(data) ? data
        : Array.isArray(data?.sessions) ? data.sessions
        : Array.isArray(data?.results) ? data.results
        : [];

      if (error && !sessions.length) {
        if (resultsList) resultsList.innerHTML = '<p style="color:var(--muted);padding:16px;">Erreur de chargement des sessions.</p>';
        return;
      }

      // Masquer les loading-state
      document.querySelectorAll('.loading-state').forEach(el => el.style.display = 'none');

      // Stats
      const completes = sessions.filter(s => s.statut === 'termine' || s.finalise === true);
      const enAttente = sessions.filter(s => s.statut !== 'termine' && !s.finalise);
      const scores = completes.map(s => s.score ?? s.score_total ?? null).filter(n => n !== null);
      const scoreMoyen = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

      if (statEnvoyes)  statEnvoyes.textContent  = sessions.length;
      if (statCompletes) statCompletes.textContent = completes.length;
      if (statScore)    statScore.textContent    = scoreMoyen !== null ? scoreMoyen + '%' : '—';
      if (statAttente)  statAttente.textContent  = enAttente.length;

      // Mise à jour du topbar
      const topbarInfo = document.querySelector('.topbar-actions span');
      if (topbarInfo) topbarInfo.textContent = `${completes.length} complétés · ${enAttente.length} en attente`;

      // Rendu des cartes
      if (resultsList) {
        if (!sessions.length) {
          resultsList.innerHTML = '<p style="color:var(--muted);padding:16px;">Aucun test pour le moment.</p>';
          return;
        }
        resultsList.innerHTML = '';
        sessions
          .sort((a, b) => (b.score ?? b.score_total ?? 0) - (a.score ?? a.score_total ?? 0))
          .forEach(s => {
            const score = s.score ?? s.score_total ?? null;
            const scorePct = score !== null ? score + '%' : '—';
            const scoreColor = score === null ? 'var(--muted)' : score >= 70 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
            const date = s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '—';
            const statut = s.finalise || s.statut === 'termine' ? '<span class="tag tag-success">Complété</span>' : '<span class="tag tag-warning">En attente</span>';
            resultsList.innerHTML += `
              <div class="stat-card" style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;margin-bottom:8px;">
                <div>
                  <div style="font-weight:600;font-size:14px;">${s.candidat?.prenom ?? ''} ${s.candidat?.nom ?? s.candidat_id ?? '—'}</div>
                  <div style="font-size:12px;color:var(--muted);margin-top:2px;">${s.pole ?? '—'} · ${date}</div>
                </div>
                <div style="display:flex;align-items:center;gap:14px;">
                  ${statut}
                  <span style="font-size:20px;font-weight:700;color:${scoreColor};">${scorePct}</span>
                </div>
              </div>`;
          });
      }
    } catch (e) {
      console.error('[tests] erreur', e);
      if (resultsList) resultsList.innerHTML = '<p style="color:var(--danger);padding:16px;">Erreur de chargement.</p>';
    }
  })();
});
