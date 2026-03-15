import { requireAdmin } from '../../utils/auth.utils.js';
import { getAllSessions, getSessionWithAnswers } from '../../services/sessions.service.js';
import { sendTestResult } from '../../services/email.service.js'; // TODO: endpoint à implémenter côté backend
import { qs, qsa } from '../../utils/dom.utils.js';
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

  // TODO: implémenter le rendu des cartes de résultats, boutons, etc.
});
