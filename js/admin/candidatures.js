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

  // TODO: implémenter le rendu du tableau, filtres, panel détail, boutons, etc.
});
