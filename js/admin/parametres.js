import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getSettings, updateSettings } from '../../services/settings.service.js';
import { qs } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  initProfilModal();

  const nameEl = qs('#sidebar-user-name');
  if (nameEl) nameEl.textContent = getAdminName() || 'Admin';

  // ── Navigation entre sections ─────────────────────────────
  window.switchSection = (el, sectionId) => {
    document.querySelectorAll('.params-nav-item')
      .forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.params-section')
      .forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    const sec = document.getElementById('sec-' + sectionId);
    if (sec) sec.classList.add('active');
  };

  // ── WhatsApp ──────────────────────────────────────────────
  window.editWa = (pole) => {
    const editDiv = document.getElementById(`wa-${pole}-edit`);
    const input   = document.getElementById(`wa-${pole}-input`);
    const display = document.getElementById(`wa-${pole}-display`);
    if (!editDiv) return;
    if (input && display) input.value = display.textContent === 'Non configuré' 
      ? '' : display.textContent;
    editDiv.style.display = 'block';
  };

  window.cancelWa = (pole) => {
    const editDiv = document.getElementById(`wa-${pole}-edit`);
    if (editDiv) editDiv.style.display = 'none';
  };

  window.saveWa = async (pole) => {
    const input   = document.getElementById(`wa-${pole}-input`);
    const display = document.getElementById(`wa-${pole}-display`);
    const val     = input?.value?.trim();
    if (!val) { showToast('URL invalide', 'error'); return; }

    try {
      const key  = `whatsapp_${pole}`;
      const { error } = await updateSettings({ [key]: val });
      if (error) { showToast('Erreur sauvegarde', 'error'); return; }
      if (display) display.textContent = val;

      // Mettre à jour le dot
      const row  = document.getElementById(`wa-${pole}-edit`)?.previousElementSibling;
      const dot  = row?.querySelector('.wa-dot');
      if (dot) { dot.classList.remove('empty'); dot.classList.add('ok'); }

      cancelWa(pole);
      showToast('Lien WhatsApp sauvegardé ✓');
    } catch(e) {
      showToast('Erreur inattendue', 'error');
    }
  };

  // ── Templates email ───────────────────────────────────────
  let _currentTpl = null;

  window.editTemplate = (btn, tplId) => {
    _currentTpl = tplId;
    const card    = btn.closest('.tpl-card');
    const preview = card?.querySelector('.tpl-preview')?.textContent || '';
    const label   = card?.querySelector('.tpl-lbl')?.textContent || '';
    const editor  = document.getElementById('tpl-editor');
    const title   = document.getElementById('tpl-editor-title');
    const body    = document.getElementById('tpl-body');
    if (title) title.textContent = 'Modifier : ' + label;
    if (body)  body.textContent  = preview;
    if (editor) editor.style.display = '';
    editor?.scrollIntoView({ behavior: 'smooth' });
  };

  window.closeTplEditor = () => {
    const editor = document.getElementById('tpl-editor');
    if (editor) editor.style.display = 'none';
    _currentTpl = null;
  };

  window.saveTpl = async () => {
    const body    = document.getElementById('tpl-body')?.textContent?.trim();
    const subject = document.getElementById('tpl-subject')?.value?.trim();
    if (!body || !_currentTpl) return;
    try {
      const { error } = await updateSettings({
        [`tpl_${_currentTpl}_body`]:    body,
        [`tpl_${_currentTpl}_subject`]: subject,
      });
      if (error) { showToast('Erreur sauvegarde', 'error'); return; }
      showToast('Template sauvegardé ✓');
      closeTplEditor();
    } catch(e) {
      showToast('Erreur inattendue', 'error');
    }
  };

  window.insertVar = (v) => {
    const el = document.getElementById('tpl-body');
    if (!el) return;
    el.focus();
    document.execCommand('insertText', false, v);
  };

  // ── Toggle switches ───────────────────────────────────────
  window.toggleSwitch = (el) => {
    el.classList.toggle('on');
    el.classList.toggle('off');
  };

  // ── Sauvegarder tout ──────────────────────────────────────
  window.saveAll = async () => {
    const inputs = document.querySelectorAll('#sec-club .form-input');
    const data = {
      nom_club:      inputs[0]?.value,
      email_contact: inputs[1]?.value,
      universite:    inputs[2]?.value,
      session:       inputs[3]?.value,
      places_max:    parseInt(inputs[4]?.value),
      candidatures_ouvertes: document.querySelector(
        '#sec-club .toggle-track'
      )?.classList.contains('on'),
    };
    const { error } = await updateSettings(data);
    if (error) showToast('Erreur lors de la sauvegarde', 'error');
    else showToast('Paramètres sauvegardés ✓');
  };

  // ── Charger les settings ──────────────────────────────────
  (async () => {
    try {
      const { data } = await getSettings();
      const s = data?.settings ?? data?.global ?? data ?? {};

      const inputs = document.querySelectorAll('#sec-club .form-input');
      if (s.nom_club && inputs[0])      inputs[0].value = s.nom_club;
      if (s.email_contact && inputs[1]) inputs[1].value = s.email_contact;
      if (s.universite && inputs[2])    inputs[2].value = s.universite;
      if (s.session && inputs[3])       inputs[3].value = s.session;
      if (s.places_max && inputs[4])    inputs[4].value = s.places_max;

      if (s.whatsapp_dev) {
        const el = qs('#wa-dev-display');
        if (el) el.textContent = s.whatsapp_dev;
      }
      if (s.whatsapp_secu) {
        const el = qs('#wa-secu-display');
        if (el) el.textContent = s.whatsapp_secu;
      }
      if (s.whatsapp_iot) {
        const el = qs('#wa-iot-display');
        if (el) el.textContent = s.whatsapp_iot;
      }
    } catch(e) {
      console.error('[parametres]', e);
    }
  })();
});
