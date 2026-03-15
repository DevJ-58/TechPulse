import { requireAdmin } from '../../utils/auth.utils.js';
import { getAllCandidates, getCandidateById, updateCandidateStatus } from '../../services/candidates.service.js';
import { createToken } from '../../services/tokens.service.js';
import { sendTestLink, sendRefusal } from '../../services/email.service.js';
import { qs, qsa, show, hide } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  // TODO: implémenter le rendu du tableau, filtres, panel détail, boutons, etc.
});
