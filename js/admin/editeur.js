import { requireAdmin } from '../../utils/auth.utils.js';
import { getQuestionsByPole, createQuestion, deleteQuestion, updateQuestion, createChoice, updateChoice, deleteChoice } from '../../services/questions.service.js';
import { qs, qsa } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  // TODO: implémenter le chargement des questions, switch pôle, création/suppression/sauvegarde, gestion des choix, etc.
});
