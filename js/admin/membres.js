import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getAllMembers, getMemberById, deactivateMember } from '../../services/members.service.js';
import { qs, qsa } from '../../utils/dom.utils.js';
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

  const loading = qs('#membres-loading');
  const list = qs('#membres-list');
  const statsGrid = qs('#membres-stats-loading');
  let _allMembres = [];

  function renderTableau(membres) {
    if (!list) return;

    if (!membres.length) {
      list.innerHTML = `
        <div class="table-wrap">
          <div class="table-scroll">
            <table style="width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;">
              <thead>
                <tr>
                  <th>Membre</th>
                  <th>Email</th>
                  <th>Pôle</th>
                  <th>Date admission</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="membres-tbody"><tr><td colspan="6" style="text-align:center;padding:16px;color:var(--muted);">Aucun membre pour le moment.</td></tr></tbody>
            </table>
          </div>
        </div>`;
      return;
    }

    list.innerHTML = `
      <div class="table-wrap">
        <div class="table-scroll">
          <table style="width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed;">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Email</th>
                <th>Pôle</th>
                <th>Date admission</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="membres-tbody"></tbody>
          </table>
        </div>
      </div>`;

    const tbody = document.getElementById('membres-tbody');
    membres.forEach(m => {
      const dateAdmission = m.date_admission || m.admis_le || m.created_at
        ? new Date(m.date_admission || m.admis_le || m.created_at).toLocaleDateString('fr-FR')
        : '—';
      const poleLabel = m.pole === 'dev' ? 'Développement'
        : m.pole === 'secu' ? 'Sécurité'
        : m.pole === 'iot' ? 'Électronique IoT'
        : m.pole || '—';

      tbody.innerHTML += `
        <tr style="border-bottom:1px solid var(--border);transition:background .15s;"
          onmouseover="this.style.background='var(--surface)'"
          onmouseout="this.style.background=''">
          <td style="padding:12px 14px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="sidebar-avatar" style="width:32px;height:32px;font-size:13px;flex-shrink:0;">
                ${(m.prenom || '?').charAt(0).toUpperCase()}
              </div>
              <span style="font-weight:600;">${m.prenom || ''} ${m.nom || ''}</span>
            </div>
          </td>
          <td style="padding:12px 14px;color:var(--muted);">${m.email || '—'}</td>
          <td style="padding:12px 14px;">
            <span class="tag tag-accent">${poleLabel}</span>
          </td>
          <td style="padding:12px 14px;color:var(--muted);">${dateAdmission}</td>
          <td style="padding:12px 14px;">
            <span class="tag ${m.actif ? 'tag-success' : 'tag-default'}">
              ${m.actif ? 'Actif' : 'Inactif'}
            </span>
          </td>
          <td style="padding:12px 14px;">
            <button class="btn icon-btn" style="background:none;border:none;cursor:pointer;padding:6px;border-radius:var(--radius);transition:background .15s;color:var(--accent);" onmouseover="this.style.background='var(--surface-hover, #f0f0f0)'" onmouseout="this.style.background='none'" onclick="voirMembre('${m.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="btn icon-btn" style="background:none;border:none;cursor:pointer;padding:6px;border-radius:var(--radius);transition:background .15s;color:var(--danger);" onmouseover="this.style.background='var(--surface-hover, #f0f0f0)'" onmouseout="this.style.background='none'" onclick="desactiverMembre('${m.id}', '${m.prenom} ${m.nom}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </td>
        </tr>`;
    });
  }

  (async () => {
    try {
      const { data, error } = await getAllMembers();
      console.log('[debug] getAllMembers → data:', data, '| error:', error);
      _allMembres = Array.isArray(data) ? data
        : Array.isArray(data?.membres) ? data.membres
        : Array.isArray(data?.results) ? data.results : [];

      if (statsGrid) {
        const total = _allMembres.length;
        const dev   = _allMembres.filter(m => m.pole === 'dev').length;
        const secu  = _allMembres.filter(m => m.pole === 'secu').length;
        const iot   = _allMembres.filter(m => m.pole === 'iot').length;
        statsGrid.innerHTML = `
          <div class="stat-card"><div class="stat-label">Total membres</div><div class="stat-value">${total}</div></div>
          <div class="stat-card"><div class="stat-label">Pôle Dev</div><div class="stat-value">${dev}</div></div>
          <div class="stat-card"><div class="stat-label">Pôle Sécurité</div><div class="stat-value">${secu}</div></div>
          <div class="stat-card"><div class="stat-label">Pôle IoT</div><div class="stat-value">${iot}</div></div>`;
        statsGrid.className = 'grid-4';
      }

      if (loading) loading.style.display = 'none';

      renderTableau(_allMembres);

      const topbarTag = document.querySelector('.topbar-actions .tag');
      if (topbarTag) topbarTag.textContent = `${_allMembres.length} admis`;

      // Mise à jour des compteurs filtres
      const total = _allMembres.length;
      const devC  = _allMembres.filter(m => m.pole === 'dev').length;
      const secuC = _allMembres.filter(m => m.pole === 'secu').length;
      const iotC  = _allMembres.filter(m => m.pole === 'iot').length;
      const [btnTous, btnDev, btnSecu, btnIot] = document.querySelectorAll('.filter-bar .filter-btn');
      if (btnTous) btnTous.textContent = `Tous (${total})`;
      if (btnDev)  btnDev.textContent  = `Dev (${devC})`;
      if (btnSecu) btnSecu.textContent = `Sécu (${secuC})`;
      if (btnIot)  btnIot.textContent  = `IoT (${iotC})`;

    } catch (e) {
      console.error('[membres] erreur', e);
      if (loading) loading.textContent = 'Erreur de chargement';
    }
  })();

  // Filtres
  const filterBtns = document.querySelectorAll('.filter-bar .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const text = btn.textContent.trim().toLowerCase();
      let filtered = [..._allMembres];
      if (text.startsWith('dev'))  filtered = _allMembres.filter(m => m.pole === 'dev');
      if (text.startsWith('sécu')) filtered = _allMembres.filter(m => m.pole === 'secu');
      if (text.startsWith('iot'))  filtered = _allMembres.filter(m => m.pole === 'iot');
      renderTableau(filtered);
    });
  });

  // Recherche
  const searchInput = document.querySelector('.search-box input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      const filtered = _allMembres.filter(m =>
        (m.prenom + ' ' + m.nom).toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.pole || '').toLowerCase().includes(q)
      );
      renderTableau(filtered);
    });
  }

  window.voirMembre = async (membreId) => {
    try {
      const { data, error } = await getMemberById(membreId);
      if (error || !data) { showToast('Erreur chargement membre', 'error'); return; }
      const m = data.data ?? data;

      // Remplir le panel existant (det-panel dans membres.html)
      const pName = document.getElementById('p-name');
      const pBody = document.getElementById('p-body');
      if (pName) pName.textContent = `${m.prenom || ''} ${m.nom || ''}`;

      const dateAdmission = m.date_admission || m.admis_le || m.created_at
        ? new Date(m.date_admission || m.admis_le || m.created_at)
            .toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })
        : '—';

      const poleLabel = m.pole === 'dev' ? 'Développement'
        : m.pole === 'secu' ? 'Sécurité'
        : m.pole === 'iot' ? 'Électronique IoT'
        : m.pole || '—';

      if (pBody) pBody.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;padding:4px 0;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div class="sidebar-avatar" style="width:48px;height:48px;font-size:18px;flex-shrink:0;">
              ${(m.prenom || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-weight:700;font-size:15px;">${m.prenom || ''} ${m.nom || ''}</div>
              <div style="font-size:12px;color:var(--muted);">${m.email || '—'}</div>
            </div>
          </div>
          <hr style="border:none;border-top:1px solid var(--border);margin:0;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">
            <div><div style="color:var(--muted);font-size:11px;margin-bottom:3px;">PÔLE</div>
              <span class="tag tag-accent">${poleLabel}</span></div>
            <div><div style="color:var(--muted);font-size:11px;margin-bottom:3px;">STATUT</div>
              <span class="tag ${m.actif ? 'tag-success' : 'tag-default'}">${m.actif ? 'Actif' : 'Inactif'}</span></div>
            <div><div style="color:var(--muted);font-size:11px;margin-bottom:3px;">DATE ADMISSION</div>
              <div>${dateAdmission}</div></div>
            <div><div style="color:var(--muted);font-size:11px;margin-bottom:3px;">ID MEMBRE</div>
              <div style="font-size:11px;color:var(--muted);word-break:break-all;">${m.id || '—'}</div></div>
          </div>
          ${m.candidat_id ? `
          <div style="font-size:12px;color:var(--muted);">
            Candidat d'origine : <span style="color:var(--text);">${m.candidat_id}</span>
          </div>` : ''}
        </div>`;

      // Ouvrir le panel
      document.getElementById('det-panel')?.classList.add('open');
      document.getElementById('det-overlay')?.classList.add('show');
    } catch(e) {
      console.error('[membres] voirMembre', e);
      showToast('Erreur inattendue', 'error');
    }
  };

  window.desactiverMembre = async (membreId, nom) => {
    if (!confirm(`Désactiver ${nom} ?`)) return;
    try {
      const { error } = await deactivateMember(membreId);
      if (error) { showToast('Erreur désactivation', 'error'); return; }
      showToast(`${nom} désactivé`, 'success');
      setTimeout(() => location.reload(), 1000);
    } catch(e) {
      showToast('Erreur inattendue', 'error');
    }
  };
});

