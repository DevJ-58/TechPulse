import { requireAdmin } from '../../utils/auth.utils.js';
import { getAllCandidates, getCandidateById, updateCandidateStatus } from '../../services/candidates.service.js';
import { createToken } from '../../services/tokens.service.js';
import { sendTestLink, sendRefusal } from '../../services/email.service.js';
import { qs, qsa, show, hide } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
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

  // Charger les candidats
  const tbody = qs('#cand-table-tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="4">Chargement…</td></tr>';
    (async () => {
      try {
        const { data, error } = await getAllCandidates();
        if (error) {
          tbody.innerHTML = '<tr><td colspan="4">Erreur de chargement</td></tr>';
          return;
        }
        if (data && Array.isArray(data)) {
          tbody.innerHTML = '';
          data.forEach(c => {
            tbody.innerHTML += `<tr><td>${c.prenom || ''} ${c.nom || ''}</td><td>${c.pole || ''}</td><td>${c.statut || ''}</td><td>${c.email || ''}</td></tr>`;
          });
        } else {
          tbody.innerHTML = '<tr><td colspan="4">Aucun candidat</td></tr>';
        }
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4">Erreur de chargement</td></tr>';
      }
    })();
  }

  // TODO: implémenter le rendu du tableau, filtres, panel détail, boutons, etc.
});
