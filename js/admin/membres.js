import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getAllMembers, getMemberById, deactivateMember } from '../../services/members.service.js';
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

  const loading = qs('#membres-loading');
  const list = qs('#membres-list');
  const statsGrid = qs('#membres-stats-loading');

  (async () => {
    try {
      const { data, error } = await getAllMembers();
      const membres = Array.isArray(data) ? data
        : Array.isArray(data?.membres) ? data.membres
        : Array.isArray(data?.results) ? data.results : [];

      if (statsGrid) {
        const total = membres.length;
        const dev   = membres.filter(m => m.pole === 'dev').length;
        const secu  = membres.filter(m => m.pole === 'secu').length;
        const iot   = membres.filter(m => m.pole === 'iot').length;
        statsGrid.innerHTML = `
          <div class="stat-card"><div class="stat-label">Total membres</div><div class="stat-value">${total}</div></div>
          <div class="stat-card"><div class="stat-label">Pôle Dev</div><div class="stat-value">${dev}</div></div>
          <div class="stat-card"><div class="stat-label">Pôle Sécurité</div><div class="stat-value">${secu}</div></div>
          <div class="stat-card"><div class="stat-label">Pôle IoT</div><div class="stat-value">${iot}</div></div>`;
        statsGrid.className = 'grid-4';
      }

      if (loading) loading.style.display = 'none';

      if (!membres.length) {
        if (list) list.innerHTML = '<p style="color:var(--muted);padding:16px;">Aucun membre pour le moment.</p>';
        return;
      }

      if (list) {
        list.innerHTML = '';
        membres.forEach(m => {
          list.innerHTML += `
            <div class="stat-card" style="display:flex;align-items:center;gap:14px;padding:14px 18px;margin-bottom:8px;">
              <div class="sidebar-avatar" style="flex-shrink:0;">${(m.prenom || '?').charAt(0).toUpperCase()}</div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:14px;">${m.prenom || ''} ${m.nom || ''}</div>
                <div style="font-size:12px;color:var(--muted);">${m.email || ''} · ${m.pole || '—'}</div>
              </div>
              <span class="tag ${m.actif ? 'tag-success' : 'tag-default'}">${m.actif ? 'Actif' : 'Inactif'}</span>
            </div>`;
        });
      }

      const topbarTag = document.querySelector('.topbar-actions .tag');
      if (topbarTag) topbarTag.textContent = `${membres.length} admis`;

    } catch (e) {
      console.error('[membres] erreur', e);
      if (loading) loading.textContent = 'Erreur de chargement';
    }
  })();
});
