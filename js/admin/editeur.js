import { requireAdmin } from '../../utils/auth.utils.js';
import { getQuestionsByPole, createQuestion, deleteQuestion, updateQuestion, createChoice, updateChoice, deleteChoice } from '../../services/questions.service.js';
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

  // TODO: implémenter le chargement des questions, switch pôle, création/suppression/sauvegarde, gestion des choix, etc.
});
