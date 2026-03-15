import { requireAdmin } from '../../utils/auth.utils.js';
import { getAllSessions, getSessionWithAnswers } from '../../services/sessions.service.js';
import { sendTestResult } from '../../services/email.service.js'; // TODO: endpoint à implémenter côté backend
import { qs, qsa } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  // TODO: implémenter le rendu des cartes de résultats, boutons, etc.
});
