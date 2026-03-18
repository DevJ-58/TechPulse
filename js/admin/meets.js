import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getAllMeets, createMeet, recordDecision } from '../../services/meets.service.js';
import { sendMeetInvitation, sendAdmission, sendRefusal } from '../../services/email.service.js';
import { createMember } from '../../services/members.service.js';
import { updateCandidateStatus } from '../../services/candidates.service.js';
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

  const meetsList = qs('#meets-list');
  const statsContainer = qs('#meet-stats-loading');

  (async () => {
    try {
      const { data, error } = await getAllMeets();
      const meets = Array.isArray(data) ? data
        : Array.isArray(data?.meets) ? data.meets
        : Array.isArray(data?.results) ? data.results
        : [];

      if (error && !meets.length) {
        if (meetsList) meetsList.innerHTML = '<p style="color:var(--muted);padding:16px;">Erreur de chargement des meets.</p>';
        return;
      }

      // Masquer les loading-state
      document.querySelectorAll('.loading-state').forEach(el => el.style.display = 'none');

      // Stats
      const now = new Date();
      const upcoming = meets.filter(m => new Date(m.date_heure) > now);
      const completed = meets.filter(m => m.statut === 'realise' || new Date(m.date_heure) < now);
      const totalCandidates = [...new Set(meets.map(m => m.candidat_id))].length;

      // Rendu des stats
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="grid-4">
            <div class="stat-card"><div class="stat-label">Meets planifiés</div><div class="stat-value">${meets.length}</div><div class="stat-meta">Total</div></div>
            <div class="stat-card"><div class="stat-label">À venir</div><div class="stat-value">${upcoming.length}</div><div class="stat-meta">Cette semaine</div></div>
            <div class="stat-card"><div class="stat-label">Réalisés</div><div class="stat-value">${completed.length}</div><div class="stat-meta">Ce mois</div></div>
            <div class="stat-card"><div class="stat-label">Candidats</div><div class="stat-value">${totalCandidates}</div><div class="stat-meta">Uniques</div></div>
          </div>`;
      }

      // Rendu des cartes de meets
      if (meetsList) {
        if (!meets.length) {
          meetsList.innerHTML = '<p style="color:var(--muted);padding:16px;">Aucun meet planifié pour le moment.</p>';
          return;
        }
        meetsList.innerHTML = '';
        meets
          .sort((a, b) => new Date(b.date_heure) - new Date(a.date_heure))
          .forEach(m => {
            const date = new Date(m.date_heure);
            const isPast = date < now;
            const isToday = date.toDateString() === now.toDateString();
            const status = m.statut === 'realise' || isPast ? 'Réalisé' : isToday ? 'Aujourd\'hui' : 'À venir';
            const statusClass = m.statut === 'realise' || isPast ? 'tag-success' : isToday ? 'tag-warning' : 'tag-info';
            const decision = m.decision ? (m.decision === 'admis' ? 'Admis' : 'Refusé') : null;
            const decisionClass = m.decision === 'admis' ? 'tag-success' : 'tag-danger';

            meetsList.innerHTML += `
              <div class="meet-card" style="border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;background:var(--bg);">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
                  <div>
                    <div style="font-weight:600;font-size:14px;">${m.candidat?.prenom ?? ''} ${m.candidat?.nom ?? m.candidat_id ?? '—'}</div>
                    <div style="font-size:12px;color:var(--muted);margin-top:2px;">${m.pole ?? '—'}</div>
                  </div>
                  <span class="tag ${statusClass}">${status}</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;font-size:13px;color:var(--text);margin-bottom:12px;">
                  <div>📅 ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</div>
                  <div>📍 ${m.lieu || '—'}</div>
                  <div>⏱️ ${m.duree || 30} min</div>
                </div>
                ${decision ? `<div style="margin-bottom:12px;"><span class="tag ${decisionClass}">${decision}</span></div>` : ''}
                ${!isPast && !m.decision ? `
                  <div style="display:flex;gap:8px;">
                    <button class="btn btn-success btn-xs" onclick="recordDecision('${m.id}', 'admis')">✓ Admettre</button>
                    <button class="btn btn-danger btn-xs" onclick="recordDecision('${m.id}', 'refuse')">✗ Refuser</button>
                  </div>` : ''}
              </div>`;
          });
      }
    } catch (e) {
      console.error('[meets] erreur', e);
      if (meetsList) meetsList.innerHTML = '<p style="color:var(--danger);padding:16px;">Erreur de chargement.</p>';
    }
  })();

  // Fonction globale pour enregistrer une décision
  window.recordDecision = async (meetId, decision) => {
    try {
      const { error } = await recordDecision(meetId, decision);
      if (error) {
        showToast('Erreur lors de l\'enregistrement de la décision', 'error');
        return;
      }
      showToast(`Candidat ${decision === 'admis' ? 'admis' : 'refusé'} avec succès`, 'success');
      // Recharger la page pour mettre à jour l'affichage
      setTimeout(() => location.reload(), 1500);
    } catch (e) {
      console.error('[meets] erreur décision', e);
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  };
});
