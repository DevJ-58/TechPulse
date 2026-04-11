import { requireAdmin, getAdminName, getAdminId } from '../../utils/auth.utils.js';
import { guardPage } from './utils/role-guard.js';
import { applySidebarGuard } from './utils/sidebar-guard.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { qs } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

// Stockage local des annonces (session)
let annonces = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  guardPage('annonces', 'Annonces');
  applySidebarGuard();
  initProfilModal();

  const adminNameEl = qs('.sidebar-user-name');
  if (adminNameEl) adminNameEl.textContent = getAdminName() || 'Admin';

  // Marque le lien actif
  const link = document.getElementById('nl-annonces');
  if (link) link.classList.add('active');

  // Initialise les filtres
  renderFilterBars();
  renderAnnonces();

  // Boutons composer
  const publishBtn = document.getElementById('publish-new-btn');
  const draftBtn   = document.getElementById('save-draft-btn');

  if (publishBtn) publishBtn.addEventListener('click', () => submitAnnonce(false));
  if (draftBtn)   draftBtn.addEventListener('click',   () => submitAnnonce(true));
});

// ─── FILTRES ────────────────────────────────────────────────
function renderFilterBars() {
  const statusBar = document.getElementById('annonces-filter-status');
  const poleBar   = document.getElementById('annonces-filter-pole');

  if (statusBar) statusBar.innerHTML = `
    <button class="filter-btn active" data-filter="all">Toutes</button>
    <button class="filter-btn" data-filter="publiee">Publiées</button>
    <button class="filter-btn" data-filter="brouillon">Brouillons</button>`;

  if (poleBar) poleBar.innerHTML = `
    <button class="filter-btn active" data-pole="all">Tous</button>
    <button class="filter-btn" data-pole="dev">Dev</button>
    <button class="filter-btn" data-pole="secu">Sécu</button>
    <button class="filter-btn" data-pole="iot">IoT</button>
    <button class="filter-btn" data-pole="general">Général</button>`;

  // Listeners filtres
  document.querySelectorAll('#annonces-filter-status .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#annonces-filter-status .filter-btn')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAnnonces();
    });
  });

  document.querySelectorAll('#annonces-filter-pole .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#annonces-filter-pole .filter-btn')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderAnnonces();
    });
  });
}

// ─── RENDU LISTE ────────────────────────────────────────────
function renderAnnonces() {
  const loading = document.getElementById('annonces-loading');
  const list    = document.getElementById('annonces-list');
  if (!list) return;

  const activeStatus = document.querySelector('#annonces-filter-status .filter-btn.active')
    ?.dataset.filter || 'all';
  const activePole = document.querySelector('#annonces-filter-pole .filter-btn.active')
    ?.dataset.pole || 'all';

  const filtered = annonces.filter(a => {
    const matchStatus = activeStatus === 'all' || a.statut === activeStatus;
    const matchPole   = activePole   === 'all' || a.destinataires === activePole;
    return matchStatus && matchPole;
  });

  if (loading) loading.style.display = 'none';

  if (!filtered.length) {
    list.innerHTML = `
      <div style="
        background:var(--surface);
        border:1.5px dashed var(--border);
        border-radius:var(--radius-lg);
        padding:40px 24px;
        text-align:center;
      ">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700;margin-bottom:6px;">
          Aucune annonce pour le moment.
        </div>
        <div style="font-size:13px;color:var(--muted);">
          Utilise le formulaire à droite pour rédiger et publier une annonce.
        </div>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(a => `
    <div class="annonce-card" data-id="${a.id}">
      <div class="annonce-hd">
        <div class="avatar-sm">${(getAdminName() || 'A').charAt(0).toUpperCase()}</div>
        <div class="annonce-info">
          <div class="annonce-title">${escHtml(a.titre)}</div>
          <div class="annonce-meta">
            ${formatDate(a.date)} ·
            ${labelDest(a.destinataires)} ·
            ${escHtml(a.categorie || 'Général')}
          </div>
        </div>
        <span class="tag ${a.statut === 'publiee' ? 'tag-success' : 'tag-default'}">
          ${a.statut === 'publiee' ? 'Publiée' : 'Brouillon'}
        </span>
      </div>
      <div class="annonce-body">${escHtml(a.contenu)}</div>
      <div class="annonce-ft">
        <span style="font-size:11px;color:var(--muted);">
          ${a.statut === 'publiee' ? 'Publiée' : 'Brouillon non envoyé'}
        </span>
        <div style="display:flex;gap:6px;">
          ${a.statut === 'brouillon' ? `
            <button class="btn btn-outline btn-sm"
              onclick="publishExisting('${a.id}')">Publier</button>` : ''}
          <button class="btn btn-ghost btn-sm"
            onclick="loadForEdit('${a.id}')">Modifier</button>
          <button class="btn btn-danger btn-sm"
            onclick="deleteAnnonceById('${a.id}')">Supprimer</button>
        </div>
      </div>
    </div>`
  ).join('');
}

// ─── SOUMISSION ──────────────────────────────────────────────
function submitAnnonce(isDraft) {
  const titre       = document.getElementById('ann-title')?.value?.trim();
  const contenu     = document.getElementById('ann-content')?.textContent?.trim();
  const destinataires = document.getElementById('ann-dest')?.value || 'Tous les membres';
  const categorie   = document.querySelector('.compose-body select:last-of-type')?.value || 'Général';

  if (!titre) { showToast('Le titre est obligatoire.', 'error'); return; }
  if (!contenu && !isDraft) { showToast('Le contenu est obligatoire.', 'error'); return; }

  if (editingId) {
    // Mise à jour
    const idx = annonces.findIndex(a => a.id === editingId);
    if (idx !== -1) {
      annonces[idx] = {
        ...annonces[idx], titre, contenu, destinataires, categorie,
        statut: isDraft ? 'brouillon' : 'publiee',
        date: new Date().toISOString()
      };
    }
    editingId = null;
    showToast(isDraft ? 'Brouillon mis à jour' : 'Annonce mise à jour ✓', 'success');
  } else {
    // Nouvelle annonce
    annonces.unshift({
      id: 'ann_' + Date.now(),
      titre, contenu, destinataires, categorie,
      statut: isDraft ? 'brouillon' : 'publiee',
      date: new Date().toISOString()
    });
    showToast(isDraft ? 'Brouillon sauvegardé' : 'Annonce publiée ✓', 'success');
  }

  clearCompose();
  renderAnnonces();
}

// ─── ACTIONS ────────────────────────────────────────────────
window.loadForEdit = function(id) {
  const a = annonces.find(x => x.id === id);
  if (!a) return;
  editingId = id;
  const titleEl   = document.getElementById('ann-title');
  const contentEl = document.getElementById('ann-content');
  const destEl    = document.getElementById('ann-dest');
  if (titleEl)   titleEl.value = a.titre;
  if (contentEl) contentEl.textContent = a.contenu;
  if (destEl)    destEl.value = a.destinataires;
  const compose = document.getElementById('compose-box');
  if (compose) {
    compose.scrollIntoView({ behavior: 'smooth' });
    titleEl?.focus();
  }
  showToast('Annonce chargée dans l\'éditeur');
};

window.deleteAnnonceById = function(id) {
  if (!confirm('Supprimer cette annonce ?')) return;
  annonces = annonces.filter(a => a.id !== id);
  renderAnnonces();
  showToast('Annonce supprimée');
};

window.publishExisting = function(id) {
  const idx = annonces.findIndex(a => a.id === id);
  if (idx !== -1) annonces[idx].statut = 'publiee';
  renderAnnonces();
  showToast('Annonce publiée ✓', 'success');
};

// ─── HELPERS ────────────────────────────────────────────────
function clearCompose() {
  const t = document.getElementById('ann-title');
  const c = document.getElementById('ann-content');
  if (t) t.value = '';
  if (c) c.textContent = '';
  editingId = null;
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day:'numeric', month:'short', year:'numeric'
  });
}

function labelDest(dest) {
  const map = {
    'Tous les membres': 'Tous',
    'Pôle Dev uniquement': 'Dev',
    'Pôle Sécu uniquement': 'Sécu',
    'Pôle IoT uniquement': 'IoT',
  };
  return map[dest] || dest || 'Tous';
}

