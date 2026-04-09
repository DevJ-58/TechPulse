import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getSettings, updateSettings } from '../../services/settings.service.js';
import { api } from '../../services/api.service.js';
import API_CONFIG from '../../config/api.config.js';
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
      const key  = `wa_${pole}`;
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

  window.editTemplate = async (btn, tplId) => {
    _currentTpl = tplId;
    const card  = btn.closest('.tpl-card');
    const label = card?.querySelector('.tpl-lbl')?.textContent || '';

    // Charger les vraies valeurs depuis l'API
    let body = '', subject = '';
    try {
      const { data } = await getSettings();
      const s = data?.settings ?? data?.global ?? data ?? {};
      body = s[`tpl_${tplId}_body`] || '';
      subject = s[`tpl_${tplId}_subject`] || '';
    } catch(e) {
      console.error('[editTemplate]', e);
      showToast('Erreur chargement template', 'error');
      return;
    }

    const editor  = document.getElementById('tpl-editor');
    const title   = document.getElementById('tpl-editor-title');
    const bodyEl  = document.getElementById('tpl-body');
    const subjEl  = document.getElementById('tpl-subject');

    if (title) title.textContent = 'Modifier : ' + label;
    if (bodyEl) bodyEl.textContent = body;
    if (subjEl) subjEl.value = subject;
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

  let _currentPoleId = null;
  const _polesCache = {};

  async function chargerPoles() {
    try {
      const { data, error } = await api.get(API_CONFIG.ENDPOINTS.SETTINGS_POLES);
      if (error) throw new Error(error);
      const poles = Array.isArray(data)
        ? data
        : Array.isArray(data?.poles)
          ? data.poles
          : Array.isArray(data?.data)
            ? data.data
            : [];
      poles.forEach(p => { if (p?.id) _polesCache[p.id] = p; });
      rendrePoles(poles);
    } catch(e) {
      console.error('[chargerPoles]', e);
      const list = qs('#poles-list');
      if (list) list.innerHTML = '<p style="color:var(--danger);">Erreur chargement des pôles</p>';
    }
  }

  function rendrePoles(poles) {
    const list = qs('#poles-list');
    const countEl = qs('#poles-count');
    if (countEl) countEl.textContent = `${poles.length} pôle${poles.length === 1 ? '' : 's'}`;
    if (!list) return;
    list.innerHTML = '';
    if (!poles.length) {
      list.innerHTML = '<p style="color:var(--muted);">Aucun pôle trouvé</p>';
      return;
    }
    poles.forEach(p => {
      const state = p.actif ? 'Actif' : 'Inactif';
      const stateClass = p.actif ? 'tag-accent' : 'tag-default';
      list.innerHTML += `
        <div class="params-card" style="margin-bottom:12px;">
          <div class="params-card-hd" style="align-items:flex-start;gap:12px;">
            <div>
              <div class="params-card-title">${p.nom || 'Pôle sans nom'}</div>
              <div style="font-size:12px;color:var(--muted);margin-top:4px;">${p.description || 'Aucune description'}</div>
            </div>
            <span class="tag ${stateClass}">${state}</span>
          </div>
          <div class="params-card-body" style="padding-top:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
              <div style="font-size:12px;color:var(--muted);">Places max : <strong>${p.places_max ?? '—'}</strong></div>
              <button class="btn btn-outline btn-sm" onclick="ouvrirModalModifierPole('${p.id}')">Modifier</button>
            </div>
          </div>
        </div>`;
    });
  }

  window.ouvrirModalAjouterPole = () => {
    _currentPoleId = null;
    ouvrirModalPole(null);
  };

  window.ouvrirModalModifierPole = (poleId) => {
    const pole = _polesCache[poleId] || null;
    _currentPoleId = pole?.id || null;
    ouvrirModalPole(pole);
  };

  function ouvrirModalPole(pole) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'pole-modal';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>${pole ? 'Modifier un pôle' : 'Ajouter un pôle'}</h3>
          <span class="modal-close" onclick="fermerPoleModal()">✕</span>
        </div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Nom</label><input id="pole-name" type="text" class="form-input" value="${pole?.nom || ''}"></div>
          <div class="form-group"><label class="form-label">Description</label><textarea id="pole-description" class="form-input" rows="4">${pole?.description || ''}</textarea></div>
          <div class="form-group"><label class="form-label">Nombre de places</label><input id="pole-places-max" type="number" class="form-input" value="${pole?.places_max ?? ''}"></div>
          <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div>
              <div class="form-label">Actif</div>
              <div style="font-size:11px;color:var(--muted);">Le pôle sera disponible aux candidats</div>
            </div>
            <div id="pole-actif-toggle" class="toggle-track ${pole?.actif ? 'on' : 'off'}" onclick="toggleSwitch(this)"><div class="toggle-thumb"></div></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="fermerPoleModal()">Annuler</button>
          <button class="btn btn-primary" onclick="sauvegarderPole()">${pole ? 'Enregistrer' : 'Créer'}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.classList.add('open');
  }

  window.fermerPoleModal = () => {
    const overlay = qs('#pole-modal');
    if (overlay) overlay.remove();
  };

  window.sauvegarderPole = async () => {
    const nom = qs('#pole-name')?.value?.trim();
    const description = qs('#pole-description')?.value?.trim();
    const placesMax = parseInt(qs('#pole-places-max')?.value || '0', 10);
    const actif = qs('#pole-actif-toggle')?.classList.contains('on');
    if (!nom) { showToast('Nom du pôle requis', 'error'); return; }
    const body = { nom, description, places_max: placesMax, actif };
    try {
      const result = _currentPoleId
        ? await api.patch(API_CONFIG.ENDPOINTS.SETTINGS_POLE_BY_ID, { pole_id: _currentPoleId }, body)
        : await api.put(API_CONFIG.ENDPOINTS.SETTINGS_POLES, {}, body);
      if (result.error) throw new Error(result.error);
      showToast(`Pôle ${_currentPoleId ? 'mis à jour' : 'créé'} ✓`, 'success');
      fermerPoleModal();
      await chargerPoles();
    } catch(e) {
      console.error('[sauvegarderPole]', e);
      showToast('Erreur : ' + e.message, 'error');
    }
  };

  // ── Sauvegarder tout ──────────────────────────────────────
  window.saveAll = async () => {
    const data = {
      nom_club:      qs('#club-name')?.value?.trim(),
      email_contact: qs('#club-email')?.value?.trim(),
      universite:    qs('#club-universite')?.value?.trim(),
      session:       qs('#club-session')?.value?.trim(),
      places_max:    parseInt(qs('#club-places-max')?.value || '0', 10),
      candidatures_ouvertes: qs('#toggle-candidatures')?.classList.contains('on'),
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

      if (s.nom_club && qs('#club-name'))      qs('#club-name').value = s.nom_club;
      if (s.email_contact && qs('#club-email')) qs('#club-email').value = s.email_contact;
      if (s.universite && qs('#club-universite')) qs('#club-universite').value = s.universite;
      if (s.session && qs('#club-session'))     qs('#club-session').value = s.session;
      if (s.places_max != null && qs('#club-places-max')) qs('#club-places-max').value = s.places_max;

      const toggle = qs('#toggle-candidatures');
      if (toggle) {
        if (s.candidatures_ouvertes) {
          toggle.classList.add('on');
          toggle.classList.remove('off');
        } else {
          toggle.classList.add('off');
          toggle.classList.remove('on');
        }
      }

      if (s.wa_dev) {
        const el = qs('#wa-dev-display');
        if (el) el.textContent = s.wa_dev;
      }
      if (s.wa_secu) {
        const el = qs('#wa-secu-display');
        if (el) el.textContent = s.wa_secu;
      }
      if (s.wa_iot) {
        const el = qs('#wa-iot-display');
        if (el) el.textContent = s.wa_iot;
      }

      await chargerPoles();
    } catch(e) {
      console.error('[parametres]', e);
    }
  })();
});

