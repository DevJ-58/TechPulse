const BASE_URL = "https://techpulse-backend.vercel.app"; // "https://techpulse-backend.vercel.app"';

async function apiCall(method, endpoint, body = null) {
  // Pour les endpoints de test, utiliser le token de session
  // Pour les endpoints admin, utiliser le token admin
  const isTestEndpoint = endpoint.includes('/tests/sessions') 
                      || endpoint.includes('/tests/tokens');
  const token = isTestEndpoint
    ? (sessionStorage.getItem('tp_test_token') || sessionStorage.getItem('tp_admin_token'))
    : (sessionStorage.getItem('tp_admin_token') || sessionStorage.getItem('tp_test_token'));
  const headers = { 
    'Content-Type': 'application/json',
    // 'ngrok-skip-browser-warning': 'true'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(BASE_URL + endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { data: data?.data ?? data, error: res.ok ? null : data?.detail, status: res.status };
  } catch(e) {
    return { data: null, error: e.message, status: 0 };
  }
}

async function getQuestionsByPole(pole) {
  const tokenUuid = sessionStorage.getItem('tp_test_token');
  const sessionId = sessionStorage.getItem('tp_session_id');
  try {
    const url = `${BASE_URL}/api/v1/questions/public?pole=${pole}&token_uuid=${tokenUuid}`;
    console.log('[exam] tentative endpoint public →', url);
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('[exam] status public →', res.status);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.questions) ? data.questions
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.results) ? data.results
        : [];
      console.log('[exam] questions via endpoint public →', list.length);
      if (list.length > 0) return { data: list, status: res.status };
    }

    const adminToken = sessionStorage.getItem('tp_admin_token');
    if (adminToken) {
      console.log('[exam] fallback endpoint admin');
      const resAdmin = await fetch(
        `${BASE_URL}/api/v1/questions?pole=${pole}&actif=true`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );
      if (resAdmin.ok) {
        const dataAdmin = await resAdmin.json().catch(() => null);
        const listAdmin = Array.isArray(dataAdmin) ? dataAdmin
          : Array.isArray(dataAdmin?.data) ? dataAdmin.data
          : Array.isArray(dataAdmin?.questions) ? dataAdmin.questions
          : [];
        console.log('[exam] questions via endpoint admin →', listAdmin.length);
        return { data: listAdmin, status: resAdmin.status };
      }
    }

    return { data: null, error: 'Aucune question trouvée', status: 404 };
  } catch(e) {
    console.error('[exam] getQuestionsByPole error', e);
    return { data: null, error: e.message, status: 0 };
  }
}

async function submitAnswer(sessionId, body) {
  const tokenUuid = sessionStorage.getItem('tp_test_token');
  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/tests/sessions/${sessionId}/answers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          token_uuid: tokenUuid,
          ...body
        })
      }
    );
    console.log('[exam] submitAnswer ?', res.status);
    const data = await res.json().catch(() => null);
    return { data, status: res.status };
  } catch(e) {
    console.warn('[exam] submitAnswer error', e);
    return { data: null, error: e.message, status: 0 };
  }
}

async function finaliserSession(sessionId) {
  const tokenUuid = sessionStorage.getItem('tp_test_token');
  try {
    const res = await fetch(
      `${BASE_URL}/api/v1/tests/sessions/${sessionId}/finaliser`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ token_uuid: tokenUuid })
      }
    );
    console.log('[exam] finaliserSession ?', res.status);
    const data = await res.json().catch(() => null);
    return { data, status: res.status };
  } catch(e) {
    console.error('[exam] finaliserSession error', e);
    return { data: null, error: e.message, status: 0 };
  }
}

async function lockToken(uuid, reason) {
  // Le token se verrouille automatiquement via la session
  // Pas d'endpoint séparé nécessaire
  console.log('[exam] lockToken appelé à gérer par finaliserSession');
  return { data: null, error: null, status: 200 };
}

document.addEventListener('DOMContentLoaded', async () => {

  // -- Récupérer les infos de session -----------------------
  const uuid       = sessionStorage.getItem('tp_test_token');
  const sessionId  = sessionStorage.getItem('tp_session_id');
  const pole       = sessionStorage.getItem('tp_pole') || sessionStorage.getItem('tp_candidat_pole');
  const nomCandidat = sessionStorage.getItem('tp_candidat_nom');

  console.log('[exam] SESSION DEBUG →', {
    uuid: sessionStorage.getItem('tp_test_token'),
    sessionId: sessionStorage.getItem('tp_session_id'),
    pole: sessionStorage.getItem('tp_pole') || sessionStorage.getItem('tp_candidat_pole'),
    adminToken: sessionStorage.getItem('tp_admin_token') ? 'présent' : 'absent'
  });

  // Si test déjà soumis, afficher page de fin immédiatement
  if (sessionStorage.getItem('tp_test_submitted') === 'true') {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;
        justify-content:center;flex-direction:column;text-align:center;
        padding:40px;background:var(--t-bg);font-family:var(--sans);">
        <div style="width:60px;height:60px;border:2px solid var(--t-accent);
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          margin:0 auto 24px;color:var(--t-accent);">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style="font-family:var(--display);font-size:28px;font-weight:800;
          color:var(--t-text);margin-bottom:10px;">Test déjà soumis.</h2>
        <p style="font-size:14px;color:var(--t-muted);max-width:360px;
          line-height:1.7;">
          Tu as déjà complété ce test.
          Le lien n'est plus utilisable.
        </p>
      </div>`;
    return;
  }

  if (!uuid || !sessionId || 
      sessionStorage.getItem('tp_test_submitted') === 'true') {
    // Rediriger vers access si pas de session valide
    if (sessionStorage.getItem('tp_test_submitted') !== 'true') {
      window.location.href = 'access.html';
    }
    return;
  }

  // Ne bloquer que si tp_test_submitted est déjà true
  // tp_exam_in_progress seul ne suffit pas car il peut rester
  // d'une session précédente non nettoyée
  const wasSubmitted = sessionStorage.getItem('tp_test_submitted');
  if (wasSubmitted === 'true') {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;
        justify-content:center;flex-direction:column;text-align:center;
        padding:40px;background:var(--t-bg);font-family:var(--sans);">
        <h2 style="font-family:var(--display);font-size:28px;font-weight:800;
          color:var(--t-text);margin-bottom:10px;">Test déjà soumis.</h2>
        <p style="font-size:14px;color:var(--t-muted);max-width:360px;
          line-height:1.7;">
          Tu as déjà complété ce test. Le lien n'est plus utilisable.
        </p>
      </div>`;
    return;
  }

  // Nettoyer tp_exam_in_progress au démarrage pour éviter
  // les faux positifs de sessions précédentes
  sessionStorage.removeItem('tp_exam_in_progress');

  // Marquer que le test est en cours dès maintenant
  sessionStorage.setItem('tp_exam_in_progress', 'true');

  // -- état global -------------------------------------------
  let questions     = { A: [], B: [], C: [] };
  window._examQuestions = questions;
  let currentPart   = 'A';
  let currentQIndex = 0;
  let answers       = {};
  let qTimer        = null;
  let autoAdvanceTimer = null;  // ← nouveau
  let globalTimer   = null;
  let globalSeconds = 15 * 60;
  let abandoned     = false;
  let submitted     = false;

  // -- Réserver les fonctions, implémentées plus bas ----
  window.nextStep   = () => {};
  window.prevStep   = () => {};
  window.onAnswer   = () => {};
  window.updateChar = () => {};
  window.submitExam = async () => {};
  window.returnToTest = () => {};

  // -- Charger les questions depuis l'API --------------------
  try {
    const { data, error } = await getQuestionsByPole(pole);
    console.log('[exam] RAW data from API ?', JSON.stringify(data));
    console.log('[exam] pole demandé ?', pole);

    const list = Array.isArray(data) ? data
      : Array.isArray(data?.questions) ? data.questions
      : Array.isArray(data?.results)   ? data.results
      : Array.isArray(data?.data)      ? data.data
      : [];

    console.log('[exam] questions parsées ?', list.length, list.map(q => q.id));
    window._examQuestions = questions;

    // Trier par partie
    questions.A = list.filter(q => (q.partie || q.part || '').toUpperCase() === 'A');
    questions.B = list.filter(q => (q.partie || q.part || '').toUpperCase() === 'B');
    questions.C = list.filter(q => (q.partie || q.part || '').toUpperCase() === 'C');

    console.log('[exam] répartition ?', {
      A: questions.A.length,
      B: questions.B.length,
      C: questions.C.length
    });

    if (list.length > 0) {
      // Injecter les questions dans le HTML
      renderAllQuestions();
      console.log('[exam] wraps C dans le DOM →', 
        document.querySelectorAll('[id^="qwrap-C"]').length);
    } else {
      // Aucune question trouvée ; afficher une erreur claire, pas de fallback statique
      ['A', 'B', 'C'].forEach(p => {
        const loader = document.getElementById(`questions-loader-${p}`);
        if (loader) {
          loader.innerHTML = `<div style="color:var(--t-red);padding:20px;">
            Aucune question disponible pour ce pôle (${pole}). 
            Contacte l'administrateur.
          </div>`;
        }
      });
      console.error('[exam] Aucune question trouvée pour le pôle', pole);
    }
  } catch(e) {
    console.error('[exam] erreur chargement questions', e);
  }

  // -- Rendu des questions -----------------------------------
  function renderAllQuestions() {
    // Supprimer les loaders
    ['A', 'B', 'C'].forEach(p => {
      const loader = document.getElementById(`questions-loader-${p}`);
      if (loader) loader.remove();
    });

    ['A', 'B', 'C'].forEach(part => {
      const section = document.getElementById(`section-${part}`);
      if (!section || !questions[part].length) return;

      // Vider les questions existantes (statiques)
      const existingWraps = section.querySelectorAll('.question-wrap, .sit-q-card');
      existingWraps.forEach(el => el.remove());

      questions[part].forEach((q, idx) => {
        const num   = idx + 1;
        const total = questions[part].length;
        const qId   = `${part}${num}`;

        if (part === 'C') {
          // Questions ouvertes
          const card = document.createElement('div');
          card.className = 'sit-q-card';
          card.id = `qwrap-${qId}`;
          // Cacher toutes les cartes C sauf la première
          if (idx > 0) card.style.display = 'none';
          card.innerHTML = `
            <div class="sit-q-head">C → Situation ${num}/${total}</div>
            <div class="sit-q-body">
              <div class="sit-q-text">${q.enonce || q.question || q.texte || ''}</div>
              <div class="sit-q-sub">${q.description || q.contexte || ''}</div>
              <textarea class="exam-textarea" id="ans-${qId}" rows="6"
                placeholder="Réponds ici…" 
                oninput="updateChar('${qId}')"></textarea>
              <div class="char-counter">
                <span id="char-${qId}">0</span> caractères
              </div>
            </div>`;
          section.querySelector('.exam-body, .sit-hint') 
            ? section.appendChild(card) 
            : section.appendChild(card);
        } else {
          // QCM
          const choices = q.choix || q.choices || q.options || [];
          const lettres = ['A', 'B', 'C', 'D', 'E'];
          const choicesHtml = choices.map((c, i) => {
            const val   = (c.id || c.value || lettres[i]).toLowerCase();
            const texte = c.texte || c.text || c.label || c;
            return `
              <input type="radio" name="q${qId}" id="${qId}${lettres[i].toLowerCase()}" 
                class="qcm-opt" value="${val}" onchange="onAnswer('${qId}')">
              <label for="${qId}${lettres[i].toLowerCase()}" class="qcm-lbl">
                <span class="opt-ltr">${lettres[i]}</span> ${texte}
              </label>`;
          }).join('');

          const wrap = document.createElement('div');
          wrap.className = 'question-wrap';
          wrap.id = `qwrap-${qId}`;
          if (idx > 0) wrap.style.display = 'none';
          wrap.innerHTML = `
            <div class="question-display">
              <div class="q-topbar">
                <span class="q-id">${part} → Question ${num}/${total}</span>
                <div class="q-countdown" id="cd-${qId}">
                  <div class="q-cring">
                    <svg width="26" height="26" viewBox="0 0 26 26">
                      <circle class="qcr-track" cx="13" cy="13" r="10"/>
                      <circle class="qcr-fill" id="qcr-${qId}" cx="13" cy="13" 
                        r="10" stroke-dasharray="62.8" stroke-dashoffset="0"/>
                    </svg>
                    <div class="q-cring-val" id="cdv-${qId}">20</div>
                  </div>
                  <span id="cdt-${qId}">20s</span>
                </div>
              </div>
              <div class="q-body">
                <div class="q-text">${q.enonce || q.question || q.texte || ''}</div>
                <div class="qcm-list">${choicesHtml}</div>
              </div>
            </div>
            <div class="q-advancing" id="adv-${qId}">// Passage automatique…</div>`;
          section.appendChild(wrap);
        }
      });
      console.log(`[exam] rendu partie ${part} → ${questions[part].length} questions créées dans le DOM`);
    });
  }

  // -- Timer global ------------------------------------------
  function startGlobalTimer() {
    const display = document.getElementById('timer-display');
    globalTimer = setInterval(() => {
      globalSeconds--;
      const m = Math.floor(globalSeconds / 60);
      const s = globalSeconds % 60;
      if (display) display.textContent = 
        `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      
      const timerEl = document.getElementById('global-timer');
      if (globalSeconds <= 120 && timerEl) timerEl.classList.add('warn');
      if (globalSeconds <= 30 && timerEl)  timerEl.classList.add('danger');
      if (globalSeconds <= 0) {
        clearInterval(globalTimer);
        submitExam();
      }
    }, 1000);
  }

  // -- Timer par question (A et B) ---------------------------
  function startQuestionTimer(qId, seconds = 20) {
    clearQTimer();
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    let remaining = seconds;
    let autoAdvanceFired = false;
    const fillEl = document.getElementById(`qcr-${qId}`);
    const valEl  = document.getElementById(`cdv-${qId}`);
    const txtEl  = document.getElementById(`cdt-${qId}`);
    const cdEl   = document.getElementById(`cd-${qId}`);
    const circumference = 62.8;
    // Capturer la partie et l'index au moment où le timer démarre
    const timerPart = currentPart;
    const timerIdx  = currentQIndex;

    qTimer = setInterval(() => {
      // Si on a changé de question depuis, annuler silencieusement
      if (currentPart !== timerPart || currentQIndex !== timerIdx) {
        clearQTimer();
        return;
      }
      remaining--;
      if (valEl) valEl.textContent = remaining;
      if (txtEl) txtEl.textContent = `${remaining}s`;
      if (fillEl) {
        const offset = circumference * (1 - remaining / seconds);
        fillEl.style.strokeDashoffset = offset;
      }
      if (remaining <= 5 && cdEl)  cdEl.classList.add('danger');
      if (remaining <= 10 && cdEl) cdEl.classList.add('warn');
      if (remaining <= 0) {
        clearQTimer();
        if (autoAdvanceFired) return;
        autoAdvanceFired = true;
        if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
        const advEl = document.getElementById(`adv-${qId}`);
        if (advEl) advEl.classList.add('show');
        autoAdvanceTimer = setTimeout(() => {
          autoAdvanceTimer = null;
          // Vérifier encore une fois qu'on est toujours sur cette question
          if (currentPart === timerPart && currentQIndex === timerIdx) nextStep();
        }, 800);
      }
    }, 1000);

    qTimer._markFired = () => { autoAdvanceFired = true; };
  }

  function clearQTimer() {
    if (qTimer) { clearInterval(qTimer); qTimer = null; }
  }

  // -- Navigation --------------------------------------------
  const PARTS = ['A', 'B', 'C'];

  function getCurrentQuestions() {
    return questions[currentPart] || [];
  }

  function showQuestion(part, idx) {
    // ── Annuler immédiatement tout avancement automatique en cours ──
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    clearQTimer();
    currentPart   = part;
    currentQIndex = idx;

    // Cacher toutes les sections
    PARTS.forEach(p => {
      const s = document.getElementById(`section-${p}`);
      if (s) s.classList.remove('active');
    });

    // Afficher la bonne section
    const section = document.getElementById(`section-${part}`);
    if (section) section.classList.add('active');

    // Tabs
    PARTS.forEach(p => {
      const tab = document.getElementById(`tab-${p}`);
      if (tab) tab.classList.toggle('active', p === part);
    });

    const qList = getCurrentQuestions();
    const total = qList.length;
    const q     = qList[idx];
    const qId = `${part}${idx + 1}`;  // toujours séquentiel pour le DOM
    const qBackendId = q?.id;          // UUID backend pour l'API uniquement

    console.log('[exam] showQuestion →', { part, idx, qId, 
      wrapFound: !!document.getElementById(`qwrap-${qId}`) });

    // Afficher/cacher les question-wrap pour TOUTES les parties
    if (part === 'C') {
      // Partie C : une question à la fois, sans timer automatique
      qList.forEach((_, i) => {
        const wrap = document.getElementById(`qwrap-C${i + 1}`);
        if (wrap) wrap.style.display = i === idx ? '' : 'none';
      });
    } else {
      // Parties A et B : une question à la fois, avec timer
      qList.forEach((_, i) => {
        const wrap = document.getElementById(`qwrap-${part}${i+1}`);
        if (wrap) wrap.style.display = i === idx ? '' : 'none';
      });
      startQuestionTimer(qId);
    }

    // Mise à jour progress
    updateProgress(part, idx, total);
    updateNav(part, idx, total);
    updateDots(part, idx, qList);
  }

  function updateProgress(part, idx, total) {
    const partIdx   = PARTS.indexOf(part);
    const totalQ    = PARTS.reduce((acc, p) => acc + (questions[p].length || 3), 0);
    const doneQ     = PARTS.slice(0, partIdx).reduce((acc, p) => acc + (questions[p].length || 3), 0) + idx;
    const pct       = Math.round((doneQ / totalQ) * 100);
    const fillEl    = document.getElementById('progress-fill');
    const pctEl     = document.getElementById('progress-pct');
    const labelEl   = document.getElementById('progress-label');
    if (fillEl)  fillEl.style.width = `${pct}%`;
    if (pctEl)   pctEl.textContent  = `${pct}%`;
    if (labelEl) labelEl.textContent = `Partie ${part} → Q${idx+1}/${total}`;
  }

  function updateNav(part, idx, total) {
    const btnPrev   = document.getElementById('btn-prev');
    const btnNext   = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');
    const navPart   = document.getElementById('nav-part');
    const navQ      = document.getElementById('nav-q');
    if (navPart) navPart.textContent = part;
    if (navQ)    navQ.textContent    = idx + 1;

    const isFirst = part === 'A' && idx === 0;
    const partsWithQ  = PARTS.filter(p => questions[p] && questions[p].length > 0);
    const lastPartWithQ = partsWithQ[partsWithQ.length - 1] || 'C';
    const lastQIdx = (questions[lastPartWithQ]?.length || 1) - 1;
    const isVeryLast = (part === PARTS[PARTS.length - 1]) && (idx === questions[part].length - 1);

    console.log('[exam] updateNav →', { part, idx, total, isVeryLast, lastPartWithQ, lastQIdx });

    // Parties A et B : pas de boutons, passage auto via timer ou clic
    // Partie C : navigation manuelle
    if (part === 'C') {
      if (btnPrev)   btnPrev.style.display   = idx === 0 ? 'none' : '';
      if (btnNext)   btnNext.style.display   = isVeryLast ? 'none' : '';
      if (btnSubmit) btnSubmit.style.display = isVeryLast ? '' : 'none';
    } else {
      if (btnPrev)   btnPrev.style.display   = 'none';
      if (btnNext)   btnNext.style.display   = 'none';
      if (btnSubmit) btnSubmit.style.display = 'none';
    }
  }

  function updateDots(part, idx, qList) {
    const dotsEl = document.getElementById('q-dots');
    if (!dotsEl) return;
    dotsEl.innerHTML = qList.map((q, i) => {
      const qId  = q?.id || `${part}${i+1}`;
      const done = answers[qId] !== undefined;
      const curr = i === idx;
      return `<div class="q-dot ${curr ? 'current' : done ? 'answered' : ''}"></div>`;
    }).join('');
  }

  // -- Gestion abandon (visibilitychange) --------------------
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden' && !submitted) {
      abandoned = true;
      const overlay = document.getElementById('abandon-overlay');
      if (overlay) overlay.classList.add('show');

      let count = 10;
      const countEl = document.getElementById('abandon-count');
      const interval = setInterval(async () => {
        count--;
        if (countEl) countEl.textContent = count;
        if (count <= 0 || !abandoned) {
          clearInterval(interval);
          if (count <= 0) {
            await lockToken(uuid, 'abandoned');
            window.location.href = 'access.html';
          }
        }
      }, 1000);
    } else if (document.visibilityState === 'visible') {
      abandoned = false;
      const overlay = document.getElementById('abandon-overlay');
      if (overlay) overlay.classList.remove('show');
    }
  });


  // Réassigner les vraies fonctions maintenant que tout est défini
  window.nextStep = () => {
    // Sauvegarder la réponse C courante avant de naviguer
    if (currentPart === 'C') {
      const qId = `C${currentQIndex + 1}`;
      const ta  = document.getElementById(`ans-${qId}`);
      if (ta) answers[qId] = ta.value;
    }

    clearQTimer();
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }

    const partActuelle = currentPart;
    const idxActuel    = currentQIndex;
    const qList        = questions[partActuelle] || [];
    const nextIdx      = idxActuel + 1;

    // Cas 1 : il reste des questions dans cette partie
    if (nextIdx < qList.length) {
      showQuestion(partActuelle, nextIdx);
      return;
    }

    // Cas 2 : chercher la prochaine partie avec des questions
    const partIdx = PARTS.indexOf(partActuelle);
    for (let i = partIdx + 1; i < PARTS.length; i++) {
      const nextPart = PARTS[i];
      if (questions[nextPart] && questions[nextPart].length > 0) {
        showQuestion(nextPart, 0);
        return;
      }
    }

    // Cas 3 : plus rien → soumettre
    window.submitExam();
  };

  window.prevStep = () => {
    clearQTimer();
    const newIdx = currentQIndex - 1;
    if (newIdx >= 0) {
      showQuestion(currentPart, newIdx);
    } else {
      const prevPartIdx = PARTS.indexOf(currentPart) - 1;
      if (prevPartIdx >= 0) {
        const prevPart = PARTS[prevPartIdx];
      const prevList = questions[prevPart] || [];
      showQuestion(prevPart, Math.max(0, prevList.length - 1));
      }
    }
  };

  window.onAnswer = (qId) => {
    // Guard : ignorer si on est déjà en train de traiter cette question
    if (window._processingAnswer === qId) return;
    window._processingAnswer = qId;
    setTimeout(() => { window._processingAnswer = null; }, 100);

    const selected = document.querySelector(`input[name="q${qId}"]:checked`);
    if (!selected) return;
    answers[qId] = selected.value.toLowerCase();

    // Parties A et B : avancer automatiquement après un court délai
    const part = qId.charAt(0);
    if (part !== 'C') {
      if (qTimer?._markFired) qTimer._markFired();
      clearQTimer();
      // Annuler tout setTimeout d'avance automatique en cours
      if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
      const advEl = document.getElementById(`adv-${qId}`);
      if (advEl) advEl.classList.add('show');
      autoAdvanceTimer = setTimeout(() => {
        autoAdvanceTimer = null;
        const currentQId = `${currentPart}${currentQIndex + 1}`;
        if (currentQId === qId) window.nextStep();
      }, 600);
    }

    console.log('[exam] réponse ?', qId, selected.value);
    
    const idx  = parseInt(qId.slice(1)) - 1;
    const q    = questions[part]?.[idx];

    console.log('[exam] onAnswer ?', { qId, part, idx, q, sessionId });

    if (q?.id && sessionId) {
      submitAnswer(sessionId, {
        question_id: q.id,
        valeur_saisie: selected.value.toLowerCase(),
        partie: part
      }).then(r => console.log('[exam] submitAnswer result ?', r.status, r.data))
        .catch(e => console.warn('[exam] submitAnswer error', e));
    } else {
      console.warn('[exam] PROBLÈME : question_id manquant', { q, sessionId });
      // Tentative de fallback : chercher dans toutes les parties
      const allQ = [...questions.A, ...questions.B, ...questions.C];
      console.log('[exam] toutes les questions disponibles ?', allQ.map(x => x.id));
    }
  };

  window.updateChar = (qId) => {
    const ta      = document.getElementById(`ans-${qId}`);
    const counter = document.getElementById(`char-${qId}`);
    if (ta) {
      // Stocker dans answers IMMÉDIATEMENT à chaque frappe
      answers[qId] = ta.value;
      if (counter) counter.textContent = ta.value.length;
    }
  };

  window.submitExam = async () => {
    if (submitted) return;
    submitted = true;
    clearQTimer();
    clearInterval(globalTimer);

    // ── CAPTURE IMMÉDIATE des réponses C avant tout changement DOM ──
    // Garantit que les valeurs sont lues AVANT l'overlay
    if (questions.C && questions.C.length > 0) {
      questions.C.forEach((q, i) => {
        const qId = `C${i + 1}`;
        const ta = document.getElementById(`ans-${qId}`);
        if (ta && ta.value.trim()) {
          // Sauvegarder dans le cache answers MAINTENANT
          answers[qId] = ta.value.trim();
          console.log(`[exam] capture C${i+1} :`, answers[qId].substring(0, 50));
        }
      });
    }

    // Afficher un loader immédiatement
    const overlay = document.getElementById('submit-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div style="text-align:center;">
          <div style="width:48px;height:48px;border:3px solid var(--t-border);
            border-top-color:var(--t-accent);border-radius:50%;
            animation:spin 1s linear infinite;margin:0 auto 20px;"></div>
          <div style="font-family:var(--display);font-size:20px;font-weight:800;
            color:var(--t-text);margin-bottom:8px;">Envoi en cours…</div>
          <div style="font-size:13px;color:var(--t-muted);">
            Ne ferme pas cette page.
          </div>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>`;
    }

    // ── Sauvegarder TOUTES les réponses C ──────────────────
    // Priorité : DOM → cache answers{} → chaîne vide
    // On soumet même si vide pour que le backend enregistre
    // toutes les questions (affichées comme "Non répondu" côté admin)
    if (questions.C.length > 0) {
      console.log('[exam] soumission réponses C :', questions.C.length, 'questions');
      for (const [i, q] of questions.C.entries()) {
        const qId = `C${i + 1}`;

        // 1. Essayer de lire depuis le DOM
        const ta = document.getElementById(`ans-${qId}`);
        let valeur = ta ? ta.value.trim() : '';

        // 2. Fallback : cache answers{}
        if (!valeur && answers[qId]) {
          valeur = String(answers[qId]).trim();
        }

        console.log(`[exam] C${i+1} → question_id=${q.id} | valeur="${valeur.substring(0,50)}" | sessionId=${sessionId}`);

        if (!sessionId) {
          console.warn(`[exam] C${i+1} IGNORÉE — sessionId manquant`);
          continue;
        }

        // On soumet même si valeur vide pour marquer la question
        // comme "traitée" côté backend
        await submitAnswer(sessionId, {
          question_id:   q.id,
          valeur_saisie: valeur || null,
          partie:        'C',
          auto_passe:    valeur ? false : true
        }).then(r => {
          console.log(`[exam] C${i+1} submitAnswer → status=${r.status}`);
          if (r.status !== 200 && r.status !== 201) {
            console.warn(`[exam] C${i+1} réponse inattendue :`, r.data);
          }
        }).catch(e => {
          console.error(`[exam] C${i+1} submitAnswer ERREUR :`, e);
        });
      }
      console.log('[exam] toutes les réponses C soumises');
    }

    // Finaliser la session
    let finaliseOk = false;
    if (sessionId) {
      try {
        const result = await finaliserSession(sessionId);
        finaliseOk = result.status === 200;
        console.log('[exam] finaliserSession ?', result.status);
      } catch(e) {
        console.error('[exam] finaliserSession error', e);
      }
    }

    // Verrouiller le token
    try {
      await lockToken(uuid, 'completed');
      console.log('[exam] token verrouillé');
    } catch(e) {
      console.warn('[exam] lockToken error', e);
    }

    // Marquer définitivement comme soumis en sessionStorage
    sessionStorage.setItem('tp_exam_in_progress', 'false');
    sessionStorage.setItem('tp_test_submitted', 'true');
    sessionStorage.setItem('tp_session_id', '');
    sessionStorage.setItem('tp_test_token', '');

    // Afficher l'overlay de succès
    if (overlay) {
      overlay.innerHTML = `
        <div class="submit-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" 
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 class="submit-title">Test soumis.</h2>
        <p class="submit-desc">
          Tes réponses ont été envoyées à l'équipe TechPulse. 
          Tu recevras un email dans les 48-72h avec la décision.
        </p>
        <div class="submit-steps">
          <div class="submit-step">
            <div class="s-ico done">?</div> Réponses enregistrées
          </div>
          <div class="submit-step">
            <div class="s-ico done">?</div> Lien verrouillé
          </div>
          <div class="submit-step">
            <div class="s-ico wait">…</div> Correction en cours
          </div>
          <div class="submit-step">
            <div class="s-ico wait">…</div> Email de résultat à venir
          </div>
        </div>`;
    }
  };

  window.returnToTest = () => {
    document.getElementById('abandon-overlay')?.classList.remove('show');
    abandoned = false;
  };

  // Attacher les listeners directement sur les boutons
  document.getElementById('btn-next')?.addEventListener('click', window.nextStep);
  document.getElementById('btn-prev')?.addEventListener('click', window.prevStep);
  document.getElementById('btn-submit')?.addEventListener('click', window.submitExam);
  document.querySelector('.abandon-return')?.addEventListener('click', window.returnToTest);

  // -- Démarrage ---------------------------------------------
  startGlobalTimer();
  showQuestion('A', 0);
});


