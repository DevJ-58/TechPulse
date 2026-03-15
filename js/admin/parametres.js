import { requireAdmin } from '../../utils/auth.utils.js';
import { getSettings, updateSettings } from '../../services/settings.service.js';
import { qs, setLoading } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  // TODO: charger settings, pré-remplir, gérer sauvegarde, liens WhatsApp, etc.
});
