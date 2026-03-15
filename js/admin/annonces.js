import { requireAdmin } from '../../utils/auth.utils.js';
import { getSettings, updateSettings } from '../../services/settings.service.js';
import { qs, qsa } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  // TODO: utiliser settings.service ou endpoint /announcements si dispo
});
