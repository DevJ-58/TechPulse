import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getQuestionsByPole, createQuestion, deleteQuestion } from '../../services/questions.service.js';
import { qs } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  initProfilModal();

  const nameEl = qs('#sidebar-user-name');
  if (nameEl) nameEl.textContent = getAdminName() || 'Admin';

  // ── Helpers ──────────────────────────────────────────────
  function getAdminId() {
    try {
      const t = sessionStorage.getItem('tp_admin_token');
      return JSON.parse(atob(t.split('.')[1])).sub;
    } catch(e) { return null; }
  }

  const LETTRES = ['A', 'B', 'C', 'D', 'E'];

  // ── Compter les questions par pôle ───────────────────────
  async function chargerCount(pole) {
    const countEl = qs(`#qc-${pole}`);
    const container = qs(`#pole-${pole}`);
    if (countEl) countEl.innerHTML = '…';
    try {
      const { data, error } = await getQuestionsByPole(pole);
      console.log(`[editeur] questions ${pole} →`, { data, error });
      
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.questions) ? data.questions : [];
      
      if (countEl) countEl.textContent = list.length;

      const headerEl = qs(`#pole-${pole} .pole-q-count`);
      if (headerEl) headerEl.textContent = 
        `${list.length} question${list.length > 1 ? 's' : ''} · 15 minutes`;

      if (container) {
        container.querySelectorAll('.q-card').forEach(el => el.remove());
        container.querySelectorAll('.q-empty-msg').forEach(el => el.remove());
        
        if (list.length === 0) {
          container.querySelectorAll('.sec-grp-hd').forEach(hd => {
            const empty = document.createElement('div');
            empty.className = 'q-empty-msg';
            empty.style.cssText = 
              'padding:16px;color:var(--muted);font-size:12px;text-align:center;';
            empty.textContent = 
              'Aucune question — clique sur + Question pour en ajouter';
            hd.after(empty);
          });
        } else {
          ['A','B','C'].forEach(async partie => {
            const group = list
              .filter(q => q.partie === partie)
              .sort((a,b) => (a.ordre||0) - (b.ordre||0));
            
            for (let idx = 0; idx < group.length; idx++) {
              const q    = group[idx];
              const card = creerQCard(pole, partie, idx + 1);
              card.dataset.qid   = q.id;
              card.dataset.saved = 'true';

              const enonceEl = card.querySelector('.q-enonce');
              if (enonceEl) enonceEl.value = q.enonce || '';

              const situationEl = card.querySelector('.q-situation');
              if (situationEl) situationEl.value = q.description || q.contexte || '';

              // Injecter les choix depuis q.choices (inclus dans la réponse liste)
              if (q.partie !== 'C') {
                const choicesList = Array.isArray(q.choices) ? q.choices : [];
                console.log(`[editeur] choix pour ${q.id} →`, choicesList);
                if (choicesList.length > 0) {
                  card.querySelectorAll('.choice-row').forEach(r => r.remove());
                  const addChoiceBtn = card.querySelector('.add-choice');
                  const LETTRES_LOCAL = ['A', 'B', 'C', 'D', 'E'];
                  choicesList.forEach((c, ci) => {
                    const div = document.createElement('div');
                    div.className = 'choice-row';
                    div.innerHTML = `
                      <span class="choice-ltr">${c.lettre || LETTRES_LOCAL[ci] || '?'}</span>
                      <input type="text" value="${(c.texte || c.text || '').replace(/"/g, '&quot;')}">
                      <input type="radio" name="saved-q-${q.id}" class="correct-rb" ${c.est_correct || c.est_correcte || c.is_correct ? 'checked' : ''}>`;
                    if (addChoiceBtn) addChoiceBtn.before(div);
                    else card.querySelector('.q-card-body').appendChild(div);
                  });
                }
              }

              // Insérer la card dans le bon groupe
              const grpHeaders = container.querySelectorAll('.sec-grp-hd');
              let inserted = false;
              grpHeaders.forEach(hd => {
                if (!inserted && hd.querySelector('button')
                    ?.getAttribute('onclick')?.includes(`'${partie}'`)) {
                  let next = hd.nextElementSibling;
                  while (next && (next.classList.contains('q-card')
                    || next.classList.contains('q-empty-msg'))) {
                    next = next.nextElementSibling;
                  }
                  container.insertBefore(card, next);
                  inserted = true;
                }
              });
              if (!inserted) container.appendChild(card);
            }
          });
        }
      }
    } catch(e) {
      if (countEl) countEl.textContent = '—';
      console.error('[editeur] chargerCount error', e);
    }
  }

  ['dev', 'secu', 'iot'].forEach(p => chargerCount(p));

  // ── Créer une card question dans le DOM ──────────────────
  function creerQCard(pole, partie, ordre) {
    const isC = partie === 'C';
    const tagLabel = partie === 'A' ? 'QCM · 20s'
      : partie === 'B' ? 'Pratique · 20s' : 'Situation';
    const tagClass = partie === 'A' ? 'tag-default'
      : partie === 'B' ? 'tag-warning' : 'tag-accent';

    const card = document.createElement('div');
    card.className = 'q-card';
    card.dataset.pole   = pole;
    card.dataset.partie = partie;
    card.dataset.ordre  = ordre;
    card.dataset.saved  = 'false';

    if (isC) {
      card.innerHTML = `
        <div class="q-card-hd">
          <span class="q-num-tag">${partie}-${ordre}</span>
          <div style="display:flex;gap:6px;">
            <span class="tag ${tagClass}">${tagLabel}</span>
            <button class="btn btn-ghost btn-icon btn-sm"
              onclick="deleteQ(this)">✕</button>
          </div>
        </div>
        <div class="q-card-body">
          <div class="form-group" style="margin-bottom:6px;">
            <label class="form-label">Situation</label>
            <textarea class="form-input form-textarea q-situation"
              rows="2" placeholder="Décris la situation…"></textarea>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Question</label>
            <textarea class="form-input form-textarea q-enonce"
              rows="2" placeholder="La question posée…"></textarea>
          </div>
          <div style="margin-top:12px;display:flex;justify-content:flex-end;">
            <button class="btn btn-primary btn-sm"
              onclick="saveQuestion(this)">Sauvegarder</button>
          </div>
        </div>`;
    } else {
      const choicesHtml = LETTRES.slice(0, 4).map((l, i) => `
        <div class="choice-row">
          <span class="choice-ltr">${l}</span>
          <input type="text" placeholder="Choix ${l}">
          <input type="radio" name="new-q-${pole}-${partie}-${ordre}"
            class="correct-rb" ${i === 0 ? 'checked' : ''}>
        </div>`).join('');

      card.innerHTML = `
        <div class="q-card-hd">
          <span class="q-num-tag">${partie}-${ordre}</span>
          <div style="display:flex;gap:6px;">
            <span class="tag ${tagClass}">${tagLabel}</span>
            <button class="btn btn-ghost btn-icon btn-sm"
              onclick="deleteQ(this)">✕</button>
          </div>
        </div>
        <div class="q-card-body">
          <div class="form-group" style="margin-bottom:10px;">
            <label class="form-label">Énoncé</label>
            <input type="text" class="form-input q-enonce"
              placeholder="La question…">
          </div>
          <label class="form-label">
            Choix (coche la bonne réponse)
          </label>
          ${choicesHtml}
          <span class="add-choice" onclick="addChoice(this)"
            style="cursor:pointer;font-size:12px;color:var(--accent);
            margin-top:8px;display:inline-block;">
            + Ajouter un choix
          </span>
          <div style="margin-top:12px;display:flex;
            justify-content:flex-end;">
            <button class="btn btn-primary btn-sm"
              onclick="saveQuestion(this)">Sauvegarder</button>
          </div>
        </div>`;
    }
    return card;
  }

  // ── Compter les questions existantes dans le DOM ─────────
  function countQInDom(pole, partie) {
    const container = qs(`#pole-${pole}`);
    if (!container) return 0;
    return container.querySelectorAll(
      `.q-card[data-partie="${partie}"]`
    ).length;
  }

  // ── Ajouter une question (appelé depuis HTML) ────────────
  window._moduleAddQuestion = (pole, partie) => {
    const container = qs(`#pole-${pole}`);
    if (!container) {
      showToast('Section pôle introuvable', 'error');
      return;
    }

    const ordre = countQInDom(pole, partie) + 1;
    const card  = creerQCard(pole, partie, ordre);

    // Insérer avant le bouton "+ Question" du bon groupe
    const grpHeaders = container.querySelectorAll('.sec-grp-hd');
    let insertBefore = null;
    grpHeaders.forEach(hd => {
      if (hd.querySelector(`button`)
          ?.getAttribute('onclick')
          ?.includes(`'${partie}'`)) {
        // Cherche la prochaine section ou la fin
        let next = hd.nextElementSibling;
        while (next && next.classList.contains('q-card')) {
          next = next.nextElementSibling;
        }
        insertBefore = next;
      }
    });

    if (insertBefore) {
      container.insertBefore(card, insertBefore);
    } else {
      container.appendChild(card);
    }

    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast(`Question ${partie}-${ordre} ajoutée — remplis et sauvegarde`);
  };

  // ── Sauvegarder une question ─────────────────────────────
  window._moduleSaveQuestion = async (btn) => {
    const card   = btn.closest('.q-card');
    const pole   = card.dataset.pole;
    const partie = card.dataset.partie;
    const ordre  = parseInt(card.dataset.ordre);
    const adminId = getAdminId();
    const existingQId = card.dataset.qid;
    const isUpdate = existingQId && existingQId !== '';

    btn.disabled = true;
    btn.textContent = 'Sauvegarde…';

    try {
      let enonce = '';
      let contexte = '';

      if (partie === 'C') {
        const situation = card.querySelector('.q-situation')?.value?.trim();
        const question  = card.querySelector('.q-enonce')?.value?.trim();
        enonce   = question || '';
        contexte = situation || '';
      } else {
        enonce = card.querySelector('.q-enonce')?.value?.trim() || '';
      }

      if (!enonce) {
        showToast('L\'énoncé est vide', 'error');
        btn.disabled = false;
        btn.textContent = 'Sauvegarder';
        return;
      }

      const payload = {
        pole,
        partie,
        enonce,
        type: partie === 'C' ? 'situation' : partie === 'B' ? 'pratique' : 'qcm',
        duree_sec: partie === 'C' ? 0 : 20,
        ordre,
        actif: true,
        cree_par_admin_id: adminId,
        description: contexte || '',
      };

      let data, error, qId;

      if (isUpdate) {
        const token = sessionStorage.getItem('tp_admin_token');
        // PATCH la question existante
        const patchRes = await fetch(
          `http://localhost:3000/api/v1/questions/${existingQId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(payload)
          }
        );
        const patchData = await patchRes.json();
        data  = patchData?.data ?? patchData;
        error = patchRes.ok ? null : (patchData?.detail || 'Erreur PATCH');
        qId   = existingQId;

        // Supprimer les choix existants via DELETE
        if (!error && partie !== 'C') {
          const existingQRes = await fetch(
            `http://localhost:3000/api/v1/questions/${qId}`,
            { headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } }
          );
          if (existingQRes.ok) {
            const existingQ = await existingQRes.json();
            const existingChoices = Array.isArray(existingQ.choices) ? existingQ.choices : [];
            console.log('[editeur] choix existants à supprimer →', existingChoices.length);
            for (const c of existingChoices) {
              await fetch(
                `http://localhost:3000/api/v1/questions/${qId}/choices/${c.id}`,
                {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
                }
              );
            }
          }
        }
      } else {
        // Création d'une nouvelle question via POST
        const result = await createQuestion(payload);
        data  = result.data;
        error = result.error;
        qId   = data?.id || data?.data?.id;
      }

      console.log('[editeur] save result →', { data, error, qId, isUpdate });

      if (error) {
        showToast('Erreur : ' + JSON.stringify(error), 'error');
        btn.disabled = false;
        btn.textContent = 'Sauvegarder';
        return;
      }
      card.dataset.qid  = qId || '';
      card.dataset.saved = 'true';

      if (partie !== 'C' && qId) {
        const rows    = card.querySelectorAll('.choice-row');
        const token   = sessionStorage.getItem('tp_admin_token');
        let choiceOrdre = 1;
        for (const row of rows) {
          const texte   = row.querySelector('input[type="text"]')
            ?.value?.trim();
          const correct = row.querySelector('.correct-rb')
            ?.checked || false;
          if (!texte) continue;
          const choiceLettre = LETTRES[choiceOrdre - 1] || 'A';
          const choiceRes = await fetch(
            `http://localhost:3000/api/v1/questions/${qId}/choices`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
              },
              body: JSON.stringify({
                lettre: choiceLettre,
                texte,
                est_correct: correct,
                ordre: choiceOrdre
              })
            }
          );
          const choiceData = await choiceRes.json();
          console.log('[editeur] POST choice →', choiceRes.status, choiceData);
          choiceOrdre++;
        }
      }

      // Recharger la question depuis le backend pour afficher les choix à jour
      if (qId && partie !== 'C') {
        try {
          const token = sessionStorage.getItem('tp_admin_token');
          const freshRes = await fetch(
            `http://localhost:3000/api/v1/questions/${qId}`,
            { headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } }
          );
          if (freshRes.ok) {
            const freshQ = await freshRes.json();
            console.log('[editeur] question fraîche →', freshQ);

            // Réinjecter description dans le champ situation (partie C)
            if (partie === 'C') {
              const sitEl = card.querySelector('.q-situation');
              if (sitEl) sitEl.value = freshQ.description || freshQ.contexte || '';
              const qEl = card.querySelector('.q-enonce');
              if (qEl) qEl.value = freshQ.enonce || '';
            }

            const freshChoices = Array.isArray(freshQ.choices) ? freshQ.choices : [];
            console.log('[editeur] choix après sauvegarde →', freshChoices);

            if (freshChoices.length > 0) {
              card.querySelectorAll('.choice-row').forEach(r => r.remove());
              const addChoiceBtn = card.querySelector('.add-choice');
              const LETTRES_LOCAL = ['A', 'B', 'C', 'D', 'E'];
              freshChoices.forEach((c, ci) => {
                const div = document.createElement('div');
                div.className = 'choice-row';
                div.innerHTML = `
                  <span class="choice-ltr">${c.lettre || LETTRES_LOCAL[ci] || '?'}</span>
                  <input type="text" value="${(c.texte || c.text || '').replace(/"/g, '&quot;')}">
                  <input type="radio" name="saved-q-${qId}" class="correct-rb" ${c.est_correct || c.est_correcte || c.is_correct ? 'checked' : ''}>`;
                if (addChoiceBtn) addChoiceBtn.before(div);
                else card.querySelector('.q-card-body').appendChild(div);
              });
            }
          }
        } catch(e) {
          console.warn('[editeur] rechargement choix après save', e);
        }
      }

      showToast(`Question ${partie}-${ordre} sauvegardée ✓`);
      btn.textContent = '✓ Sauvegardé';
      btn.disabled = true;
      card.dataset.saved = 'true';
      if (qId) card.dataset.qid = qId;

      // Mettre à jour le compteur sidebar après un délai
      setTimeout(() => {
        const countOnlyEl = document.querySelector(`#qc-${pole}`);
        if (countOnlyEl) countOnlyEl.textContent = '…';
        getQuestionsByPole(pole).then(({ data }) => {
          const list = Array.isArray(data) ? data
            : Array.isArray(data?.data) ? data.data
            : Array.isArray(data?.questions) ? data.questions : [];
          if (countOnlyEl) countOnlyEl.textContent = list.length;
          const headerEl = document.querySelector(`#pole-${pole} .pole-q-count`);
          if (headerEl) headerEl.textContent =
            `${list.length} question${list.length > 1 ? 's' : ''} · 15 minutes`;
        }).catch(() => {});
      }, 800);

    } catch(e) {
      console.error('[editeur] saveQuestion', e);
      showToast('Erreur inattendue', 'error');
      btn.disabled = false;
      btn.textContent = 'Sauvegarder';
    }
  };

  // ── Supprimer une question ───────────────────────────────
  window._moduleDeleteQ = async (btn) => {
    const card = btn.closest('.q-card');
    if (!card) return;
    
    const qId = card.dataset.qid;
    
    if (!confirm('Supprimer cette question ?')) return;

    // Si la question a un vrai ID backend, la supprimer via API
    if (qId && qId !== '') {
      try {
        await deleteQuestion(qId);
        chargerCount(card.dataset.pole || 'dev');
      } catch(e) {
        console.warn('[editeur] deleteQuestion', e);
      }
    }
    
    // Supprimer du DOM dans tous les cas
    card.remove();
    showToast('Question supprimée');
  };

  // ── Ajouter un choix ────────────────────────────────────
  window._moduleAddChoice = (el) => {
    const body  = el.closest('.q-card-body');
    const count = body.querySelectorAll('.choice-row').length;
    const name  = 'q' + Date.now();
    const div   = document.createElement('div');
    div.className = 'choice-row';
    div.innerHTML = `
      <span class="choice-ltr">${LETTRES[count] || '?'}</span>
      <input type="text" placeholder="Nouveau choix">
      <input type="radio" name="${name}" class="correct-rb">`;
    el.before(div);
  };

  // ── Sauvegarder tout ────────────────────────────────────
  window._moduleSaveAll = () => {
    const all = document.querySelectorAll('.q-card');
    if (!all.length) {
      showToast('Aucune question à sauvegarder');
      return;
    }
    all.forEach(card => {
      card.dataset.saved = 'false';
      const btn = card.querySelector('button.btn-primary');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Sauvegarder';
        btn.click();
      }
    });
  };

  window._moduleCloneStructure = () => {
    showToast('Structure dupliquée — complète les questions');
  };

  // ── Bridges window pour les onclick HTML ────────────────
  window.saveQuestion = (btn) => window._moduleSaveQuestion(btn);
  window.deleteQ      = (btn) => window._moduleDeleteQ(btn);
  window.addChoice    = (el)  => window._moduleAddChoice(el);
  window.saveAll      = ()    => window._moduleSaveAll();
});

