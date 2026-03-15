import { requireAdmin } from '../../utils/auth.utils.js';
import { getAllMeets, createMeet, recordDecision } from '../../services/meets.service.js';
import { sendMeetInvitation, sendAdmission, sendRefusal } from '../../services/email.service.js';
import { createMember } from '../../services/members.service.js';
import { updateCandidateStatus } from '../../services/candidates.service.js';
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
  // TODO: implémenter le rendu des meets, formulaire, modals, etc.
});
