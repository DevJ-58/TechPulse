import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getQuestionsByPole, createQuestion, deleteQuestion, updateQuestion, createChoice, updateChoice, deleteChoice } from '../../services/questions.service.js';
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

  const poles = ['dev', 'secu', 'iot'];
  const poleMap = { dev: 'dev', secu: 'secu', iot: 'iot' };

  async function chargerQuestions(pole) {
    const countEl = qs(`#qc-${pole}`);
    if (countEl) countEl.textContent = '…';
    try {
      const { data, error } = await getQuestionsByPole(poleMap[pole]);
      const questions = Array.isArray(data) ? data
        : Array.isArray(data?.questions) ? data.questions
        : Array.isArray(data?.results) ? data.results : [];
      if (countEl) countEl.textContent = questions.length;
    } catch (e) {
      console.error(`[editeur] erreur pole ${pole}`, e);
      if (countEl) countEl.textContent = '—';
    }
  }

  poles.forEach(p => chargerQuestions(p));
});
