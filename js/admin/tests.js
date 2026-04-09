import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getAllSessions } from '../../services/sessions.service.js';
import { mailLienTest, mailRefus } from '../utils/mail.utils.js';
import { qs } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';
import API_CONFIG from '../../config/api.config.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  initProfilModal();

  const nameEl = qs('#sidebar-user-name');
  if (nameEl) nameEl.textContent = getAdminName() || 'Admin';

  let _all = [];
  let _pole = 'tous';
  let _sort = 'recents';
  let _minScore = 'tous';

  // Nombre de questions actives par pôle ET par partie
  const _polesParties = {
    dev:  { A: 0, B: 0, C: 0 },
    secu: { A: 0, B: 0, C: 0 },
    iot:  { A: 0, B: 0, C: 0 }
  };

  // Cache des questions par pôle : { pole: { id: questionObj } }
  const _questionsCache = {};

  (async () => {
    const token = sessionStorage.getItem('tp_admin_token');
    const BASE  = API_CONFIG.BASE_URL;
    for (const pole of ['dev', 'secu', 'iot']) {
      try {
        // FIX #3 : on retire le filtre actif=true pour récupérer TOUTES les questions
        const r = await fetch(
          `${BASE}/api/v1/questions?pole=${pole}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!r.ok) {
          console.warn('[tests] questions non trouvées pour', pole, r.status, r.statusText);
          continue;
        }
        const contentType = r.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          console.warn('[tests] réponse non-JSON pour', pole, contentType);
          continue;
        }
        const d    = await r.json();
        const list = Array.isArray(d) ? d
          : Array.isArray(d.data) ? d.data : [];

        // Stocker le cache complet pour ce pôle
        _questionsCache[pole] = {};
        list.forEach(q => { _questionsCache[pole][q.id] = q; });

        // Compter uniquement les actives pour les totaux
        const actives = list.filter(q => q.actif !== false);
        _polesParties[pole].A = actives.filter(
          q => (q.partie || '').toUpperCase() === 'A'
        ).length;
        _polesParties[pole].B = actives.filter(
          q => (q.partie || '').toUpperCase() === 'B'
        ).length;
        _polesParties[pole].C = actives.filter(
          q => (q.partie || '').toUpperCase() === 'C'
        ).length;

        console.log('[tests] questions chargées pour', pole,
          '→', _polesParties[pole],
          '| total dans cache:', list.length);
      } catch(e) {
        console.warn('[tests] erreur chargement questions', pole, e);
      }
    }
  })();

  const resultsList = qs('#results-list');
  const topbarInfo  = document.querySelector('.topbar-actions span');

  function getScore(s) {
    if (!s.soumis) return null;

    const pole    = (s.pole || 'dev').toLowerCase();
    const parties = _polesParties[pole] || { A: 0, B: 0, C: 0 };

    const totalA = parties.A || 0;
    const totalB = parties.B || 0;

    const scoreA = (s.score_A !== null && s.score_A !== undefined)
      ? s.score_A : null;
    const scoreB = (s.score_B !== null && s.score_B !== undefined)
      ? s.score_B : null;

    const totalQuestions = totalA + totalB;
    if (totalQuestions === 0) return null;

    let correct = 0;
    if (scoreA !== null) correct += Math.min(scoreA, totalA);
    if (scoreB !== null) correct += Math.min(scoreB, totalB);

    return Math.round((correct / totalQuestions) * 100);
  }

  function isComplete(s) { return s.soumis === true; }

  function scoreColor(sc) {
    if (sc === null) return 'var(--muted)';
    return sc >= 70 ? 'var(--success)'
      : sc >= 50 ? 'var(--warning)'
      : 'var(--danger)';
  }

  function fmtDate(v) {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR');
  }

  function openPanel(panelId, overlayId) {
    const panel = document.getElementById(panelId);
    const overlay = document.getElementById(overlayId);
    if (panel) {
      panel.style.removeProperty('right');
      panel.style.removeProperty('transform');
      panel.classList.add('open');
    }
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closePanel(panelId, overlayId) {
    const panel = document.getElementById(panelId);
    const overlay = document.getElementById(overlayId);
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  window.openPanel  = openPanel;
  window.closePanel = closePanel;

  function rendreStats(sessions) {
    const done    = sessions.filter(isComplete);
    const waiting = sessions.filter(s => !isComplete(s));
    const scores  = done.map(getScore).filter(n => n !== null);
    const avgRaw  = scores.length
      ? (scores.reduce((a,b) => a+b,0) / scores.length) : null;
    const avg     = avgRaw !== null ? Math.round(avgRaw * 100) / 100 : null;

    const vals = [sessions.length, done.length,
      avg !== null ? avg+'%' : '—', waiting.length];

    document.querySelectorAll('.stat-card').forEach((card, i) => {
      const v = card.querySelector('.stat-value');
      const m = card.querySelector('.stat-meta');
      if (v) { v.textContent = vals[i]??'—'; v.classList.remove('loading-state'); }
      if (m) { m.textContent = ''; m.classList.remove('loading-state'); }
    });

    if (topbarInfo)
      topbarInfo.textContent =
        `${done.length} complétés · ${waiting.length} en attente`;
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
              <th>N°</th><th>Candidat</th><th>Pôle</th><th>Date ↓</th>
              <th>Statut</th><th>Score</th><th>Actions</th>
            </tr></thead>
            <tbody id="sessions-tbody"></tbody>
          </table>
        </div>
      </div>`;
    const tbody = document.getElementById('sessions-tbody');
    sessions.forEach((s, index) => {
      const sc   = getScore(s);
      const done = isComplete(s);
      tbody.innerHTML += `<tr>
        <td>${index + 1}</td>
        <td>${s.candidat_nom || s.nom || s.candidat_id || '—'}</td>
        <td><span class="tag tag-default">${s.pole || '—'}</span></td>
        <td>${fmtDate(s.date_debut)}</td>
        <td>${done
          ? '<span class="tag tag-success">Complété</span>'
          : '<span class="tag tag-warning">En attente</span>'}</td>
        <td><strong style="color:${scoreColor(sc)}">
          ${sc !== null ? sc+'%' : s.soumis ? 'Non noté' : 'À évaluer'}
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
      l = l.filter(s => (getScore(s)??0) >= 70);
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

    const token = sessionStorage.getItem('tp_admin_token');
    if (!token) {
      showToast('Session expirée, reconnectez-vous.', 'error');
      window.location.href = 'login.html';
      return;
    }

    document.getElementById('session-panel')?.remove();
    document.getElementById('session-overlay')?.remove();

    const BASE = API_CONFIG.BASE_URL;

    const overlay = document.createElement('div');
    overlay.id = 'session-overlay';
    overlay.className = 'detail-overlay';
    document.body.appendChild(overlay);

    const panel = document.createElement('div');
    panel.id = 'session-panel';
    panel.className = 'detail-panel';
    panel.innerHTML = `
      <div class="panel-head">
        <div class="panel-title">Détails session</div>
        <span class="panel-close"
          onclick="closePanel('session-panel','session-overlay')">✕</span>
      </div>
      <div class="panel-body" id="session-panel-body">
        <div style="color:var(--muted);font-size:13px;padding:20px;">
          Chargement…
        </div>
      </div>`;
    document.body.appendChild(panel);
    openPanel('session-panel', 'session-overlay');

    try {
      // -- 1. Charger la session -----------------------------
      const resS = await fetch(`${BASE}/api/v1/tests/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resS.ok) {
        throw new Error(`Session introuvable (HTTP ${resS.status})`);
      }
      const contentTypeS = resS.headers.get('content-type') || '';
      if (!contentTypeS.includes('application/json')) {
        throw new Error(`Réponse non-JSON pour la session : ${contentTypeS}`);
      }
      const rawS = await resS.json();
      const s = rawS.data ?? rawS;

      // -- 2. Charger le candidat ----------------------------
      let candidatNom   = s.candidat_id || '—';
      let candidatEmail = '';
      let candidatPole  = s.pole || '—';
      if (s.candidat_id) {
        try {
          const resC = await fetch(
            `${BASE}/api/v1/candidates/${s.candidat_id}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (resC.ok) {
            const rawC = await resC.json();
            const c = rawC.data ?? rawC;
            candidatNom   = [c.prenom, c.nom].filter(Boolean).join(' ') || candidatNom;
            candidatEmail = c.email || '';
            candidatPole  = c.pole || candidatPole;
          }
        } catch(e) {}
      }

      // -- 3. Charger les questions du pôle ------------------
      // Utiliser le cache si disponible, sinon refetch SANS filtre actif
      const poleKey = (candidatPole || 'dev').toLowerCase();
      let questionsMap = _questionsCache[poleKey] || {};

      if (!Object.keys(questionsMap).length) {
        try {
          // FIX #3 : pas de filtre actif=true pour tout récupérer
          const resQ = await fetch(
            `${BASE}/api/v1/questions?pole=${candidatPole}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (resQ.ok) {
            const contentTypeQ = resQ.headers.get('content-type') || '';
            if (!contentTypeQ.includes('application/json')) {
              console.warn('[voirSession] réponse non-JSON pour questions', candidatPole, contentTypeQ);
            } else {
            const rawQ = await resQ.json();
            const qList = Array.isArray(rawQ) ? rawQ
              : Array.isArray(rawQ.data) ? rawQ.data : [];
            qList.forEach(q => { questionsMap[q.id] = q; });
            _questionsCache[poleKey] = questionsMap;
            console.log('[voirSession] questions chargées pour', poleKey, ':', qList.length);
            }
          }
        } catch(e) {
          console.warn('[voirSession] erreur fetch questions', e);
        }
      }

      // -- 4. Charger les réponses ---------------------------
      let answers = [];
      try {
        const resA = await fetch(
          `${BASE}/api/v1/tests/sessions/${sessionId}/answers`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (resA.ok) {
          const rawA = await resA.json();
          answers = Array.isArray(rawA) ? rawA
            : Array.isArray(rawA.data) ? rawA.data
            : Array.isArray(rawA.reponses) ? rawA.reponses : [];
        }
      } catch(e) {}

      console.log('[voirSession] answers reçues:', answers.length, answers);

      // -- 5. FIX #2 : Construire la liste COMPLÈTE des questions --
      // Toutes les questions du pôle, enrichies avec la réponse du candidat si elle existe
      const allQuestions = Object.values(questionsMap);

      // Créer un map question_id → réponse du candidat
      const answersMap = {};
      answers.forEach(a => { answersMap[a.question_id] = a; });

      // Trier les questions par partie puis par ordre
      allQuestions.sort((a, b) => {
        const partieOrder = { A: 0, B: 1, C: 2 };
        const pA = partieOrder[(a.partie || '').toUpperCase()] ?? 9;
        const pB = partieOrder[(b.partie || '').toUpperCase()] ?? 9;
        if (pA !== pB) return pA - pB;
        return (a.ordre ?? a.index ?? 0) - (b.ordre ?? b.index ?? 0);
      });

      // -- 6. Calcul des scores par partie ------------------
      const aAnswers = answers.filter(a => (a.partie||'').toUpperCase() === 'A');
      const bAnswers = answers.filter(a => (a.partie||'').toUpperCase() === 'B');
      const cAnswers = answers.filter(a => (a.partie||'').toUpperCase() === 'C');

      const aCorrect = aAnswers.filter(a => a.est_correcte === true).length;
      const bCorrect = bAnswers.filter(a => a.est_correcte === true).length;

      const correctAB = aCorrect + bCorrect;
      const totalQ    = answers.length;

      const ratio   = totalQ > 0 ? Math.round((correctAB / totalQ) * 100) : 0;
      const scColor = ratio >= 70 ? 'var(--success)'
        : ratio >= 50 ? 'var(--warning)' : 'var(--danger)';

      // -- 7. Construire le HTML du panel --------------------
      const body = document.getElementById('session-panel-body');
      if (!body) return;

      body.innerHTML = `
      <!-- CANDIDAT -->
      <div style="display:flex;align-items:center;gap:12px;
        padding:0 0 16px;border-bottom:1px solid var(--border);margin-bottom:16px;">
        <div style="width:44px;height:44px;border-radius:var(--radius-lg);
          background:var(--accent-bg);color:var(--accent);
          font-family:var(--font-display);font-weight:800;font-size:16px;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${candidatNom.split(' ').map(w=>w[0]||'').slice(0,2).join('').toUpperCase()}
        </div>
        <div>
          <div style="font-family:var(--font-display);font-size:15px;
            font-weight:700;">${escHtml(candidatNom)}</div>
          <div style="font-size:11px;color:var(--muted);">
            ${escHtml(candidatEmail)}
            ${candidatEmail && candidatPole ? ' · ' : ''}
            <span class="tag tag-default" style="font-size:9px;">
              ${candidatPole}
            </span>
          </div>
        </div>
      </div>

      <!-- SCORES PAR PARTIE -->
      ${(() => {
        const pole    = poleKey;
        const parties = _polesParties[pole] || { A: 0, B: 0, C: 0 };
        const totalA  = parties.A;
        const totalB  = parties.B;
        const totalC  = parties.C;

        const scoreA = s.score_A !== null && s.score_A !== undefined ? s.score_A : null;
        const scoreB = s.score_B !== null && s.score_B !== undefined ? s.score_B : null;
        const scoreC = s.score_C !== null && s.score_C !== undefined ? s.score_C : null;

        const fmtScore = (score, total) => {
          if (score === null) return '—';
          if (total === 0)    return score + ' pts';
          return score + ' / ' + total;
        };

        return `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;
        gap:10px;margin-bottom:14px;">
        <div style="padding:12px;background:var(--bg);
          border:1px solid var(--border);border-radius:var(--radius);
          text-align:center;">
          <div style="font-size:18px;font-weight:700;
            color:${totalA > 0 && scoreA !== null
              ? (scoreA/totalA >= .7 ? 'var(--success)'
                : scoreA/totalA >= .5 ? 'var(--warning)' : 'var(--danger)')
              : 'var(--muted)'};">
            ${fmtScore(scoreA, totalA)}
          </div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px;">
            Partie A${totalA > 0 ? ' · '+totalA+' Q' : ''}
          </div>
        </div>
        <div style="padding:12px;background:var(--bg);
          border:1px solid var(--border);border-radius:var(--radius);
          text-align:center;">
          <div style="font-size:18px;font-weight:700;
            color:${totalB > 0 && scoreB !== null
              ? (scoreB/totalB >= .7 ? 'var(--success)'
                : scoreB/totalB >= .5 ? 'var(--warning)' : 'var(--danger)')
              : 'var(--muted)'};">
            ${totalB === 0
              ? '<span style="font-size:11px;color:var(--muted);">Pas de Qs</span>'
              : fmtScore(scoreB, totalB)}
          </div>
          <div style="font-size:10px;color:var(--muted);margin-top:2px;">
            Partie B${totalB > 0 ? ' · '+totalB+' Q' : ''}
          </div>
        </div>
        <div style="padding:12px;background:var(--surface);
          border:1.5px dashed var(--border);border-radius:var(--radius);
          text-align:center;" id="score-c-box">
          <div style="font-size:18px;font-weight:700;color:var(--muted);">
            <input type="number" id="score-c-input" min="0"
              max="${totalC > 0 ? totalC : 100}"
              placeholder="—"
              style="width:60px;border:none;background:none;
                text-align:center;font-size:18px;font-weight:700;
                color:var(--text);font-family:var(--font-body);"
              value="${scoreC !== null ? scoreC : ''}">
          </div>
          <div style="font-size:10px;color:var(--warning);
            margin-top:2px;font-weight:700;">
            Partie C ✏️${totalC > 0 ? ' · '+totalC+' Q' : ''}
          </div>
        </div>
      </div>`;
      })()}

      <!-- NOTE PARTIE C -->
      <div style="background:var(--warning-bg);border:1px solid rgba(160,88,0,.2);
        border-radius:var(--radius);padding:10px 13px;font-size:12px;
        color:var(--warning);margin-bottom:14px;display:flex;align-items:center;gap:8px;">
        <span style="font-size:15px;">⚠️</span>
        <span><strong>Partie C : note manuelle.</strong>
          Saisis un score dans la case ci-dessus, puis valide.</span>
      </div>

      <!-- SCORE TOTAL A+B -->
      ${(() => {
        const pole      = poleKey;
        const parties   = _polesParties[pole] || { A: 0, B: 0, C: 0 };
        const totalAB   = (parties.A || 0) + (parties.B || 0);
        const cAB       = (s.score_A || 0) + (s.score_B || 0);
        const pct       = totalAB > 0 ? Math.round((cAB / totalAB) * 100) : null;
        const col       = pct === null ? 'var(--muted)'
          : pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';

        return `
      <div style="text-align:center;padding:20px;background:var(--bg);
        border:1px solid var(--border);border-radius:var(--radius);
        margin-bottom:14px;">
        <div style="font-size:36px;font-weight:800;color:${col};"
          id="score-total-display">
          ${cAB} / ${totalAB}
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px;">
          ${pct !== null ? pct+'%' : ''} correctes (A+B)
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">
          Partie C corrigée manuellement
        </div>
      </div>`;
      })()}

      <!-- STATUT -->
      <div style="display:flex;align-items:center;justify-content:space-between;
        margin-bottom:16px;">
        <span style="font-size:11px;color:var(--muted);
          text-transform:uppercase;letter-spacing:.07em;">Statut</span>
        ${s.soumis
          ? '<span class="tag tag-success">Soumis ✓</span>'
          : s.abandonne
            ? '<span class="tag tag-danger">Abandonné</span>'
            : '<span class="tag tag-warning">En cours</span>'}
      </div>

      <!-- BOUTONS -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;
        margin-bottom:12px;">
        ${s.soumis ? `
        <button class="btn btn-danger"
          onclick="_refuserSession('${s.candidat_id}','${s.id}','${candidatNom.replace(/'/g, "\\'")}','${candidatEmail}','${candidatPole}')">
          ? Envoyer refus
        </button>
        <button class="btn btn-success"
          onclick="_validerSession('${s.candidat_id}','${s.id}',
            '${s.score_A || 0}','${s.score_B || 0}')">
          ✓ Valider → Meet
        </button>
        ` : `<div></div><div></div>`}
      </div>

      <!-- Bouton suppression � toujours visible -->
      <div style="margin-bottom:20px;">
        <button class="btn btn-ghost"
          style="width:100%;border:1px dashed var(--danger);
            color:var(--danger);font-size:12px;
            display:flex;align-items:center;justify-content:center;gap:6px;"
          onclick="_supprimerSession('${s.token_id}','${s.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
          Supprimer ce test
        </button>
      </div>

      <!-- RÉPONSES -->
      <div style="font-size:10px;color:var(--muted);
        text-transform:uppercase;letter-spacing:.08em;
        margin-bottom:10px;padding-top:10px;
        border-top:1px solid var(--border);">
        Réponses (${allQuestions.length} questions · ${answers.length} répondues)
      </div>
      <div id="session-answers-list"></div>`;

      // -- 8. Afficher TOUTES les questions (r�pondues ou non) --
      const answersList = document.getElementById('session-answers-list');
      if (!answersList) return;

      // Compteurs par partie pour num�roter Q correctement (A-1, A-2, B-1�)
      const partieCounters = { A: 0, B: 0, C: 0 };

      if (!allQuestions.length) {
        answersList.innerHTML =
          '<p style="color:var(--muted);font-size:12px;">Aucune question trouvée.</p>';
      } else {
        answersList.innerHTML = allQuestions.map((q) => {
          const partie = (q.partie || '?').toUpperCase();
          partieCounters[partie] = (partieCounters[partie] || 0) + 1;
          const num = partieCounters[partie];

          // Récupérer la réponse du candidat pour cette question (peut être absent)
          const a = answersMap[q.id] || null;

          const enonce = q.enonce || q.question || '(Question sans énoncé)';

          // -- FIX #1 : Résolution robuste du texte de la réponse --
          let reponseTxt = null;
          let reponseRaw = null;

          if (a) {
            // Récupérer la valeur brute à tester tous les champs possibles
            reponseRaw = a.valeur_saisie ?? a.reponse ?? a.reponse_id
              ?? a.choice_id ?? a.choix_id ?? a.valeur ?? null;

            if (reponseRaw !== null && reponseRaw !== undefined) {
              reponseTxt = String(reponseRaw);

              // Chercher dans tous les champs de choix possibles
              const choixList = Array.isArray(q.choices) ? q.choices
                : Array.isArray(q.choix) ? q.choix
                : Array.isArray(q.options) ? q.options : [];

              if (choixList.length > 0) {
                // Chercher par id OU lettre OU valeur OU texte partiel
                const found = choixList.find(c =>
                  c.id   === reponseRaw
                  || c.id   === String(reponseRaw)
                  || (c.lettre || '').toLowerCase() === String(reponseRaw).toLowerCase()
                  || (c.valeur || '').toLowerCase() === String(reponseRaw).toLowerCase()
                  || (c.value  || '').toLowerCase() === String(reponseRaw).toLowerCase()
                );
                if (found) {
                  const lettre = found.lettre || found.letter || '';
                  const texte  = found.texte  || found.text  || found.label || reponseRaw;
                  reponseTxt = lettre ? `${lettre} � ${texte}` : String(texte);
                }
                // Si toujours pas trouvé, logger pour debug
                else {
                  console.warn('[voirSession] choix non résolu:', reponseRaw,
                    '| choix disponibles:', choixList.map(c => c.id));
                }
              }
            }
          }

          // Déterminer le statut de la réponse
          const nonRepondu = a === null || reponseRaw === null;
          const isC        = partie === 'C';
          const correct    = a ? (a.est_correcte ?? null) : null;

          const iconColor = nonRepondu ? 'var(--muted)'
            : isC ? 'var(--warning)'
            : correct === true  ? 'var(--success)'
            : correct === false ? 'var(--danger)'
            : 'var(--muted)';

          const icon = nonRepondu ? '○'
            : isC ? '⚠️'
            : correct === true  ? '✓'
            : correct === false ? '✗' : '?';

          const statut = nonRepondu ? 'Non répondu'
            : isC ? 'À évaluer'
            : correct === true  ? 'Correcte'
            : correct === false ? 'Incorrecte'
            : 'Non évalué';

          // Trouver la bonne réponse
          const choixList = Array.isArray(q.choices) ? q.choices
            : Array.isArray(q.choix) ? q.choix
            : Array.isArray(q.options) ? q.options : [];

          const bonnesReponses = choixList
            .filter(c => c.est_correct === true || c.is_correct === true || c.correct === true)
            .map(c => {
              const lettre = c.lettre || c.letter || '';
              const texte  = c.texte  || c.text  || c.label || '';
              return lettre ? `${lettre} � ${escHtml(texte)}` : escHtml(texte);
            });

          return `
          <div style="background:var(--bg);border:1px solid var(--border);
            border-radius:var(--radius);margin-bottom:8px;overflow:hidden;
            ${nonRepondu ? 'opacity:0.65;' : ''}">
            <div style="display:flex;align-items:center;gap:10px;
              padding:10px 13px;cursor:pointer;user-select:none;"
              data-toggle="true">
              <span style="font-size:13px;font-weight:700;
                min-width:36px;color:${iconColor};">
                ${icon} ${partie}-${num}
              </span>
              <span style="flex:1;font-size:12px;color:var(--muted);
                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                ${escHtml(enonce.substring(0, 65))}${enonce.length > 65 ? '…' : ''}
              </span>
              <span class="tag ${nonRepondu ? 'tag-default'
                : isC ? 'tag-warning'
                : correct === true ? 'tag-success'
                : correct === false ? 'tag-danger' : 'tag-default'}"
                style="font-size:9px;white-space:nowrap;">${statut}</span>
              <svg class="chevron" xmlns="http://www.w3.org/2000/svg"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                style="transition:transform .2s;flex-shrink:0;">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            <div class="answer-detail"
              style="padding:12px 13px;border-top:1px solid var(--border);
                background:var(--surface);display:none;">
              <!-- Énoncé complet -->
              <div style="margin-bottom:10px;">
                <div style="font-size:10px;font-weight:700;
                  text-transform:uppercase;letter-spacing:.06em;
                  color:var(--muted);margin-bottom:4px;">Question</div>
                <div style="font-size:13px;line-height:1.6;">
                  ${escHtml(enonce)}
                </div>
              </div>

              <!-- Réponse donnée -->
              <div style="margin-bottom:10px;">
                <div style="font-size:10px;font-weight:700;
                  text-transform:uppercase;letter-spacing:.06em;
                  color:var(--muted);margin-bottom:4px;">Réponse donnée</div>
                <div style="font-size:13px;font-weight:600;
                  color:${iconColor};line-height:1.6;">
                  ${nonRepondu
                    ? '<em style="color:var(--muted);font-weight:400;">Non répondu</em>'
                    : escHtml(String(reponseTxt))}
                </div>
              </div>

              <!-- Bonne réponse (parties A et B uniquement) -->
              ${!isC && bonnesReponses.length ? `
              <div style="margin-bottom:${isC ? '0' : '8px'};">
                <div style="font-size:10px;font-weight:700;
                  text-transform:uppercase;letter-spacing:.06em;
                  color:var(--muted);margin-bottom:4px;">Bonne réponse</div>
                <div style="font-size:13px;color:var(--success);font-weight:600;">
                  ${bonnesReponses.join(', ') || '—'}
                </div>
              </div>` : ''}

              <!-- Note partie C -->
              ${isC ? `
              <div style="margin-top:8px;padding:8px;
                background:var(--warning-bg);border-radius:var(--radius);
                font-size:11px;color:var(--warning);">
                ⚠️ Cette réponse est évaluée manuellement · saisis le score
                Partie C dans la case en haut du panel.
              </div>` : ''}
            </div>
          </div>`;
        }).join('');

        // Toggle d�pliage des r�ponses
        answersList.addEventListener('click', e => {
          const header = e.target.closest('[data-toggle]');
          if (!header) return;
          const detail = header.nextElementSibling;
          if (!detail) return;
          const isOpen = detail.style.display === 'block';
          detail.style.display = isOpen ? 'none' : 'block';
          const chevron = header.querySelector('.chevron');
          if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
        });
      }

      // -- 9. Mise à jour score total en temps réel avec Partie C --
      const scoreCInput = document.getElementById('score-c-input');
      if (scoreCInput) {
        const pole      = poleKey;
        const parties   = _polesParties[pole] || { A: 0, B: 0, C: 0 };
        const totalAB   = (parties.A || 0) + (parties.B || 0);
        const cAB       = (s.score_A || 0) + (s.score_B || 0);

        scoreCInput.addEventListener('input', () => {
          const scoreC    = parseInt(scoreCInput.value) || 0;
          const totalAvecC = totalAB + (parties.C || 0);
          const correctAvecC = cAB + scoreC;
          const el = document.getElementById('score-total-display');
          if (el) el.textContent = `${correctAvecC} / ${totalAvecC}`;
        });
      }

    } catch(e) {
      console.error('[voirSession]', e);
      const body = document.getElementById('session-panel-body');
      if (body) body.innerHTML =
        '<p style="color:var(--danger);padding:16px;">Erreur de chargement.</p>';
    }
  };

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  window._validerSession = async (candidatId, sessionId, scoreAB) => {
    if (!candidatId) return;
    const token = sessionStorage.getItem('tp_admin_token');
    const BASE  = API_CONFIG.BASE_URL;

    const scoreCInput = document.getElementById('score-c-input');
    const scoreC = scoreCInput ? parseInt(scoreCInput.value) || null : null;

    try {
      await fetch(`${BASE}/api/v1/candidates/${candidatId}/statut`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut: 'meet_planifie' })
      });

      if (scoreC !== null && sessionId) {
        await fetch(`${BASE}/api/v1/tests/sessions/${sessionId}/finaliser`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ score_C: scoreC, soumis: true })
        }).catch(e => console.warn('[scoreC]', e));
      }

      sessionStorage.setItem('tp_meet_notif', JSON.stringify({
        candidat_id: candidatId,
        session_id:  sessionId,
        score_ab:    scoreAB,
        score_c:     scoreC,
        ts: Date.now()
      }));

      showToast('Candidat validé · redirige vers Meets…', 'success');
      closePanel('session-panel', 'session-overlay');
      setTimeout(() => {
        window.location.href = `meets.html?candidat_id=${candidatId}`;
      }, 1200);

    } catch(e) {
      console.error('[_validerSession]', e);
      showToast('Erreur lors de la validation', 'error');
    }
  };

  window._refuserSession = async (candidatId, sessionId, candidatNom, candidatEmail, candidatPole) => {
    if (!confirm('Envoyer le mail de refus � ce candidat ?')) return;
    const token = sessionStorage.getItem('tp_admin_token');
    const BASE  = API_CONFIG.BASE_URL;
    try {
      // 1. Changer le statut
      await fetch(`${BASE}/api/v1/candidates/${candidatId}/statut`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut: 'refuse' })
      });

      // 2. Envoyer mail de refus
      const [prenom, ...nomParts] = candidatNom.split(' ');
      const nom = nomParts.join(' ');
      mailRefus({
        prenom: prenom || '',
        nom: nom || '',
        email: candidatEmail || '',
        pole: candidatPole || ''
      });

      showToast('Refus enregistré · email ouvert', 'success');
      closePanel('session-panel', 'session-overlay');
      setTimeout(() => location.reload(), 1000);
    } catch(e) {
      console.error('[_refuserSession]', e);
      showToast('Erreur lors du refus', 'error');
    }
  };

  window._supprimerSession = async (tokenId, sessionId) => {
    if (!tokenId) {
      showToast('Token introuvable, suppression impossible.', 'error');
      return;
    }
    if (!confirm('Supprimer définitivement ce test ? Cette action est irréversible.')) return;

    const token = sessionStorage.getItem('tp_admin_token');
    const BASE  = API_CONFIG.BASE_URL;

    try {
      const res = await fetch(`${BASE}/api/v1/tests/tokens/${tokenId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erreur HTTP ${res.status}`);
      }

      showToast('Test supprimé avec succès.', 'success');
      closePanel('session-panel', 'session-overlay');

      // Retirer la session du tableau local sans recharger la page
      _all = _all.filter(s => s.id !== sessionId);
      rendreStats(_all);
      filtrer();

    } catch(e) {
      console.error('[_supprimerSession]', e);
      showToast('Erreur lors de la suppression : ' + e.message, 'error');
    }
  };

  (async () => {
    if (resultsList)
      resultsList.innerHTML =
        '<div style="padding:20px;color:var(--muted);">Chargement..</div>';
    try {
      const { data, error } = await getAllSessions();
      console.log('[tests] sessions →', data);
      const sessions = Array.isArray(data) ? data : [];

      const token = sessionStorage.getItem('tp_admin_token');
      const enriched = await Promise.all(sessions.map(async (s) => {
        if (!s.candidat_id) return s;
        try {
          const res = await fetch(
            API_CONFIG.BASE_URL + '/api/v1/candidates/' + s.candidat_id,
            { headers: {
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true'
            }}
          );
          if (!res.ok) return s;
          const raw = await res.json();
          const c = raw.data ?? raw;
          return {
            ...s,
            candidat_nom: [c.prenom, c.nom].filter(Boolean).join(' ')
              || c.name || c.email || s.candidat_id
          };
        } catch(e) {
          return s;
        }
      }));

      _all = enriched;
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
