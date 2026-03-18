import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getSettings, updateSettings } from '../../services/settings.service.js';
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

  const loading = qs('#annonces-loading');
  const list = qs('#annonces-list');

  (async () => {
    try {
      const { data, error } = await getSettings();
      if (error || !data) {
        if (loading) loading.textContent = 'Erreur de chargement';
        return;
      }

      const settings = data?.settings ?? data?.global ?? data ?? {};
      const annonces = Array.isArray(settings.annonces) ? settings.annonces : [];

      if (loading) loading.style.display = 'none';

      if (!annonces.length) {
        if (list) list.innerHTML = '<p style="color:var(--muted);padding:16px;">Aucune annonce pour le moment.</p>';
        return;
      }

      if (list) {
        list.innerHTML = '';
        annonces.forEach(a => {
          const date = a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '—';
          list.innerHTML += `
            <div class="stat-card" style="padding:14px 18px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <div style="font-weight:600;font-size:14px;">${a.titre || 'Annonce'}</div>
                <span class="tag tag-default">${date}</span>
              </div>
              <div style="font-size:13px;color:var(--muted);line-height:1.5;">${a.contenu || ''}</div>
              <div style="display:flex;gap:8px;margin-top:10px;border-top:1px solid var(--border);padding-top:10px;">
                <button class="btn btn-ghost btn-sm" onclick="editAnnonce('${a.id}')">Modifier</button>
                <button class="btn btn-ghost btn-sm" onclick="deleteAnnonce('${a.id}')">Supprimer</button>
              </div>
            </div>`;
        });
      }

    } catch (e) {
      console.error('[annonces] erreur', e);
      if (loading) loading.textContent = 'Erreur de chargement';
    }
  })();

  window.editAnnonce = (id) => showToast('Édition de l\'annonce ' + id);
  window.deleteAnnonce = (id) => showToast('Suppression de l\'annonce ' + id);
});
