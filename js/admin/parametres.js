import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getSettings, updateSettings } from '../../services/settings.service.js';
import { qs, setLoading } from '../../utils/dom.utils.js';
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

  (async () => {
    try {
      const { data, error } = await getSettings();
      if (error || !data) return;

      const settings = data?.settings ?? data?.global ?? data ?? {};

      if (settings.nom_club)      document.querySelector('input[value="TechPulse"]')?.setAttribute('value', settings.nom_club);
      if (settings.email_contact) document.querySelector('input[type="email"]')?.setAttribute('value', settings.email_contact);
      if (settings.session)       document.querySelectorAll('input[type="text"]')[3]?.setAttribute('value', settings.session);
      if (settings.places_max)    document.querySelector('input[type="number"]')?.setAttribute('value', settings.places_max);

      if (settings.whatsapp_dev)  { const el = qs('#wa-dev-display');  if (el) el.textContent = settings.whatsapp_dev; }
      if (settings.whatsapp_secu) { const el = qs('#wa-secu-display'); if (el) el.textContent = settings.whatsapp_secu; }
      if (settings.whatsapp_iot)  { const el = qs('#wa-iot-display');  if (el) el.textContent = settings.whatsapp_iot || 'Non configuré'; }

      document.querySelectorAll('.loading-state').forEach(el => el.style.display = 'none');
    } catch (e) {
      console.error('[parametres] erreur', e);
    }
  })();

  window.saveAll = async () => {
    const data = {
      nom_club:      document.querySelector('input[value="TechPulse"]')?.value,
      email_contact: document.querySelector('input[type="email"]')?.value,
      session:       document.querySelectorAll('input[type="text"]')[3]?.value,
      places_max:    parseInt(document.querySelector('input[type="number"]')?.value),
    };
    const { error } = await updateSettings(data);
    if (error) showToast('Erreur lors de la sauvegarde', 'error');
    else showToast('Paramètres sauvegardés ✓');
  };
});
