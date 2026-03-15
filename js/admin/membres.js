import { requireAdmin } from '../../utils/auth.utils.js';
import { getAllMembers, getMemberById, deactivateMember } from '../../services/members.service.js';
import { qs, qsa } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  // TODO: implémenter le rendu de la grille, panel profil, bouton retirer, etc.
});
