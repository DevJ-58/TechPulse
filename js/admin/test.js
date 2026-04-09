import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getAllSessions } from '../../services/sessions.service.js';
import { qs } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  initProfilModal();

  const nameEl = qs('#sidebar-user-name');
  if (nameEl) nameEl.textContent = getAdminName() || 'Admin';

  let _all = [];
  let _pole = 'tous';
  let _sort = 'score';
  let _minScore = 'tous';

  const resultsList = qs('#results-list');
  const topbarInfo  = document.querySelector('.topbar-actions span');

  function getScore(s)    { return s.score_total ?? null; }
  function isComplete(s)  { return s.soumis === true; }
  function scoreColor(sc) {
    if (sc === null) return 'var(--muted)';
    return sc >= 70 ? 'var(--success)' : sc >= 50 ? 'var(--warning)' : 'var(--danger)';
  }
  function fmtDate(v) {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR');
  }

  function rendreStats(sessions) {
    const done    = sessions.filter(isComplete);
    const waiting = sessions.filter(s => !isComplete(s));
    const scores  = done.map(getScore).filter(n => n !== null);
    const avg     = scores.length
      ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : null;

    const vals = [sessions.length, done.length,
      avg !== null ? avg + '%' : '—', waiting.length];

    document.querySelectorAll('.stat-card').forEach((card, i) => {
      const v = card.querySelector('.stat-value');
      const m = card.querySelector('.stat-meta');
      if (v) { v.textContent = vals[i] ?? '—'; v.classList.remove('loading-state'); }
      if (m) { m.textContent = ''; m.classList.remove('loading-state'); }
    });

    if (topbarInfo)
      topbarInfo.textContent = `${done.length} complétés · ${waiting.length} en attente`;
  }

  function rendreTableau(sessions) {
    if (!resultsList) return;
    if (!sessions.length) {
      resultsList.innerHTML =
        '<div style="text-align:center;padding:40px;color:var(--muted);">Aucun test trouvé</div>';
      return;
    }
    resultsList.innerHTML = `
      <div class="table-wrap">
        <div class="table-scroll">
          <table>
            <thead><tr>
              <th>Candidat</th><th>Pôle</th><th>Date</th>
              <th>Statut</th><th>Score</th><th></th>
            </tr></thead>
            <tbody id="sessions-tbody"></tbody>
          </table>
        </div>
      </div>`;
    const tbody = document.getElementById('sessions-tbody');
    sessions.forEach(s => {
      const sc   = getScore(s);
      const done = isComplete(s);
      tbody.innerHTML += `<tr>
        <td>${s.candidat_id || '—'}</td>
        <td><span class="tag tag-default">${s.pole || '—'}</span></td>
        <td>${fmtDate(s.date_debut)}</td>
        <td>${done
          ? '<span class="tag tag-success">Complété</span>'
          : '<span class="tag tag-warning">En attente</span>'}</td>
        <td><strong style="color:${scoreColor(sc)}">
          ${sc !== null ? sc + '%' : '—'}
        </strong></td>
        <td>
          <button class="btn btn-ghost btn-icon btn-sm"
            onclick="voirSession('${s.id}')" title="Voir">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </td>
      </tr>`;
    });
  }

  function filtrer() {
    let l = [..._all];
    if (_pole !== 'tous')
      l = l.filter(s => (s.pole||'').toLowerCase() === _pole);
    if (_minScore === '70')
      l = l.filter(s => (getScore(s) ?? 0) >= 70);
    if (_sort === 'score')
      l.sort((a,b) => (getScore(b)??-1) - (getScore(a)??-1));
    else
      l.sort((a,b) => new Date(b.date_debut||0) - new Date(a.date_debut||0));
    rendreTableau(l);
  }

  document.querySelectorAll('.filter-bar:nth-child(1) .filter-btn')
    .forEach((btn, i) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-bar:nth-child(1) .filter-btn')
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _pole = ['tous','dev','secu','iot'][i] ?? 'tous';
        filtrer();
      });
    });

  document.querySelectorAll('.filter-bar:nth-child(2) .filter-btn')
    .forEach((btn, i) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-bar:nth-child(2) .filter-btn')
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _sort = i === 1 ? 'recents' : 'score';
        _minScore = i === 2 ? '70' : 'tous';
        filtrer();
      });
    });

  window.voirSession = async (sessionId) => {
    if (!sessionId || sessionId === 'undefined') return;

    // Créer un panel de détails
    const existing = document.getElementById('session-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'session-panel';
    panel.style.cssText = `
      position:fixed;top:0;right:0;width:380px;height:100vh;
      background:var(--surface);border-left:1px solid var(--border);
      z-index:500;overflow-y:auto;padding:24px;
      box-shadow:-4px 0 20px rgba(0,0,0,.08);`;

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;
        align-items:center;margin-bottom:20px;">
        <div style="font-family:var(--font-display);font-weight:700;
          font-size:16px;">Détails session</div>
        <button onclick="document.getElementById('session-panel').remove()"
          style="background:none;border:none;cursor:pointer;font-size:18px;
          color:var(--muted);">?</button>
      </div>
      <div id="session-panel-body" style="color:var(--muted);font-size:13px;">
        Chargement…
      </div>`;

    document.body.appendChild(panel);

    try {
      const token = sessionStorage.getItem('tp_admin_token');
      const res = await fetch(
        'https://124f-102-206-123-155.ngrok-free.app/api/v1/tests/sessions/' + sessionId,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const raw = await res.json();
      const s = raw.data ?? raw;
      console.log('[voirSession] ?', s);

      const body = document.getElementById('session-panel-body');
      if (!body) return;

      const sc = s.score_total ?? null;
      body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div>
            <div style="font-size:10px;color:var(--muted);
              text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">
              Candidat
            </div>
            <div style="font-size:13px;font-weight:600;">${s.candidat_id || '—'}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);
              text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">
              Pôle
            </div>
            <span class="tag tag-default">${s.pole || '—'}</span>
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);
              text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">
              Date début
            </div>
            <div>${s.date_debut ? new Date(s.date_debut).toLocaleString('fr-FR') : '—'}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);
              text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">
              Date fin
            </div>
            <div>${s.date_fin ? new Date(s.date_fin).toLocaleString('fr-FR') : 'En cours'}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);
              text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">
              Durée
            </div>
            <div>${s.duree_sec ? Math.round(s.duree_sec/60) + ' min' : '—'}</div>
          </div>
          <hr style="border:none;border-top:1px solid var(--border);">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <div style="text-align:center;padding:12px;background:var(--bg);
              border:1px solid var(--border);border-radius:var(--radius);">
              <div style="font-size:18px;font-weight:700;color:var(--accent);">
                ${s.score_A ?? '—'}
              </div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px;">Partie A</div>
            </div>
            <div style="text-align:center;padding:12px;background:var(--bg);
              border:1px solid var(--border);border-radius:var(--radius);">
              <div style="font-size:18px;font-weight:700;color:var(--accent);">
                ${s.score_B ?? '—'}
              </div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px;">Partie B</div>
            </div>
            <div style="text-align:center;padding:12px;background:var(--bg);
              border:1px solid var(--border);border-radius:var(--radius);">
              <div style="font-size:18px;font-weight:700;color:var(--accent);">
                ${s.score_C ?? '—'}
              </div>
              <div style="font-size:10px;color:var(--muted);margin-top:2px;">Partie C</div>
            </div>
          </div>
          <div style="text-align:center;padding:16px;background:var(--bg);
            border:1px solid var(--border);border-radius:var(--radius);">
            <div style="font-size:28px;font-weight:800;
              color:${sc === null ? 'var(--muted)' : sc >= 70 ? 'var(--success)' : sc >= 50 ? 'var(--warning)' : 'var(--danger)'};">
              ${sc !== null ? sc + '%' : 'Non noté'}
            </div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">Score total</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);
              text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">
              Statut
            </div>
            ${s.soumis 
              ? '<span class="tag tag-success">Soumis</span>'
              : s.abandonne 
                ? '<span class="tag tag-danger">Abandonné</span>'
                : '<span class="tag tag-warning">En cours</span>'
            }
          </div>
        </div>`;
    } catch(e) {
      const body = document.getElementById('session-panel-body');
      if (body) body.innerHTML = 
        '<p style="color:var(--danger);">Erreur de chargement.</p>';
      console.error('[voirSession]', e);
    }
  };

  (async () => {
    if (resultsList)
      resultsList.innerHTML =
        '<div style="padding:20px;color:var(--muted);">Chargement…</div>';
    try {
      const { data, error } = await getAllSessions();
      console.log('[tests] data ?', data, 'error ?', error);
      _all = Array.isArray(data) ? data : [];
      rendreStats(_all);
      filtrer();
    } catch(e) {
      console.error('[tests]', e);
      if (resultsList)
        resultsList.innerHTML =
          '<p style="color:var(--danger);padding:16px;">Erreur de chargement.</p>';
    }
  })();
});


