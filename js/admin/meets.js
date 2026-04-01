

import { requireAdmin, getAdminName } from '../../utils/auth.utils.js';
import { initProfilModal } from '../../utils/profil.utils.js';
import { getAllMeets, createMeet, recordDecision } from '../../services/meets.service.js';
import { createMember } from '../../services/members.service.js';
import { mailMeet, mailRefus, mailBienvenue } 
  from '../utils/mail.utils.js';
import { qs } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin();
  initProfilModal();

  // Pré-remplir le formulaire si on vient de tests.html
  const urlParams = new URLSearchParams(window.location.search);
  const preCandidatId = urlParams.get('candidat_id');
  const notifFromTests = sessionStorage.getItem('tp_meet_notif');

  if (preCandidatId || notifFromTests) {
    const meetNotif = notifFromTests ? JSON.parse(notifFromTests) : null;
    const candidatId = preCandidatId || meetNotif?.candidat_id;

    // Pré-sélectionner le candidat dans le select
    const select = document.getElementById('meet-candidate-select');
    if (select && candidatId) {
      const trySelect = (attempts = 0) => {
        const opt = select.querySelector(`option[value="${candidatId}"]`);
        if (opt) {
          select.value = candidatId;
          const schedule = document.querySelector('.meet-schedule');
          if (schedule) {
            schedule.style.border = '2px solid var(--accent)';
            schedule.scrollIntoView({ behavior: 'smooth' });
          }
          showAdminToast(
            'Candidat pré-sélectionné — remplis la date et le lieu.',
            'success'
          );
          sessionStorage.removeItem('tp_meet_notif');
        } else if (attempts < 10) {
          setTimeout(() => trySelect(attempts + 1), 300);
        }
      };
      trySelect();
    }
  }

  // Notification depuis tests.html — nouveau candidat retenu
  const notif = sessionStorage.getItem('tp_meet_notif');
  if (notif) {
    try {
      const n = JSON.parse(notif);
      if (Date.now() - n.ts < 60000) { // valide 1 minute
        // Afficher badge notification
        showToast(`Nouveau candidat retenu à convoquer (score : ${n.score}%)`, 'success');
        // Pré-sélectionner dans le select après chargement
        window._preselect_candidat = n.candidat_id;
      }
      sessionStorage.removeItem('tp_meet_notif');
    } catch(e) {}
  }

  const nameEl = qs('#sidebar-user-name');
  if (nameEl) nameEl.textContent = getAdminName() || 'Admin';

  const meetsList      = qs('#meets-list');
  const statsContainer = qs('#meet-stats-loading');
  const meetsLoading   = qs('#meets-loading');
  let   _allMeets      = [];
  let   _filtreActif   = 'tous';

  function fmtDate(v) {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR');
  }
  function fmtTime(v) {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d) ? '' : d.toLocaleTimeString('fr-FR',
      { hour: '2-digit', minute: '2-digit' });
  }

  // ── Statut métier ────────────────────────────────────────
  // À venir  = pas de décision ET date future
  // En attente = pas de décision ET date passée
  // Réalisé  = décision prise (admis ou refusé)
  function getStatutMeet(m) {
    const now    = new Date();
    const date   = new Date(m.date);
    if (m.decision)       return 'realise';
    if (date > now)       return 'a_venir';
    return 'attente';
  }

  // ── Stats ────────────────────────────────────────────────
  function rendreStats(meets) {
    const aVenir   = meets.filter(m => getStatutMeet(m) === 'a_venir');
    const realises = meets.filter(m => getStatutMeet(m) === 'realise');
    const candidats = [...new Set(meets.map(m => m.candidat_id))].length;

    if (statsContainer) statsContainer.innerHTML = `
      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-label">Meets planifiés</div>
          <div class="stat-value">${meets.length}</div>
          <div class="stat-meta">Total</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">À venir</div>
          <div class="stat-value">${aVenir.length}</div>
          <div class="stat-meta">Sans décision · date future</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Réalisés</div>
          <div class="stat-value">${realises.length}</div>
          <div class="stat-meta">Décision prise</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Candidats</div>
          <div class="stat-value">${candidats}</div>
          <div class="stat-meta">Uniques</div>
        </div>
      </div>`;
  }

  // ── Rendu liste ──────────────────────────────────────────
  function rendreMeets(meets) {
    if (meetsLoading) meetsLoading.style.display = 'none';
    if (!meetsList) return;

    if (!meets.length) {
      meetsList.innerHTML = `
        <div style="text-align:center;padding:48px 20px;color:var(--muted);">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.5"
            style="margin:0 auto 14px;display:block;opacity:.4;">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div style="font-weight:600;margin-bottom:6px;">Aucun meet</div>
          <div style="font-size:12px;">
            Utilise le formulaire pour planifier le premier meet.
          </div>
        </div>`;
      return;
    }

    meetsList.innerHTML = '';
    meets
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach(m => {
        const statut = getStatutMeet(m);

        const statutLabel = statut === 'realise'
          ? (m.decision === 'admis' ? 'Admis ✓' : 'Refusé ✗')
          : statut === 'a_venir' ? 'À venir'
          : 'En attente décision';

        const statutClass = statut === 'realise'
          ? (m.decision === 'admis' ? 'tag-success' : 'tag-danger')
          : statut === 'a_venir' ? 'tag-accent'
          : 'tag-warning';

        meetsList.innerHTML += `
          <div class="meet-card" style="border:1px solid var(--border);
            border-radius:var(--radius-lg);padding:18px;margin-bottom:12px;
            background:var(--surface);">
            <div style="display:flex;align-items:flex-start;
              justify-content:space-between;margin-bottom:12px;">
              <div>
                <div style="font-weight:700;font-size:14px;">
                  ${m.candidat_nom || m.candidat_id || '—'}
                </div>
                <div style="font-size:12px;color:var(--muted);margin-top:2px;">
                  ${m.pole || '—'}
                  ${m.score_test != null
                    ? ' · Score test : ' + m.score_test + '%' : ''}
                </div>
              </div>
              <span class="tag ${statutClass}">${statutLabel}</span>
            </div>
            <div style="display:flex;gap:16px;font-size:13px;
              color:var(--text);margin-bottom:12px;flex-wrap:wrap;">
              <div>📅 ${fmtDate(m.date)} à ${fmtTime(m.date)}</div>
              <div>📍 ${m.lieu || '—'}</div>
              <div>⏱️ ${m.duree_min || 30} min</div>
            </div>
            ${!m.decision ? `
              <div style="display:flex;gap:8px;margin-top:4px;">
                <button class="btn btn-success btn-sm"
                  onclick="prendreDecision('${m.id}','admis')">
                  ✓ Admettre
                </button>
                <button class="btn btn-danger btn-sm"
                  onclick="prendreDecision('${m.id}','refuse')">
                  ✗ Refuser
                </button>
              </div>` : ''}
          </div>`;
      });
  }

  // ── Filtrer ──────────────────────────────────────────────
  function appliquerFiltre(filtre) {
    _filtreActif = filtre;
    let liste = [..._allMeets];
    if (filtre === 'a_venir') {
      liste = liste.filter(m => getStatutMeet(m) === 'a_venir');
    } else if (filtre === 'realise') {
      liste = liste.filter(m => getStatutMeet(m) === 'realise');
    }
    rendreMeets(liste);
  }

  // ── Charger les meets ────────────────────────────────────
  (async () => {
    try {
      const { data } = await getAllMeets();
      _allMeets = Array.isArray(data) ? data
        : Array.isArray(data?.data) ? data.data
        : Array.isArray(data?.meets) ? data.meets
        : [];

      rendreStats(_allMeets);
      rendreMeets(_allMeets);

      // Attacher les filtres APRÈS le rendu
      const filterBar = document.querySelector('.meets-layout .filter-bar');
      if (filterBar) {
        const btns = filterBar.querySelectorAll('.filter-btn');
        const filtreVals = ['tous', 'a_venir', 'realise'];
        btns.forEach((btn, i) => {
          btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appliquerFiltre(filtreVals[i]);
          });
        });
      }
    } catch(e) {
      console.error('[meets]', e);
      if (meetsList) meetsList.innerHTML =
        '<p style="color:var(--danger);padding:16px;">Erreur de chargement.</p>';
    }
  })();

  // ── Aperçu email dynamique ───────────────────────────────
  function updateApercu() {
    const select = qs('#meet-candidate-select');
    const date   = qs('#meet-date-input')?.value;
    const time   = qs('#meet-time-input')?.value;
    const lieu   = qs('#meet-location-input')?.value;
    const duree  = qs('#meet-duration-select')?.value || '30';

    const nomOpt = select?.options[select.selectedIndex]?.text || '';
    const nom    = nomOpt.split(' · ')[0] || '[Prénom]';

    let dateStr = '18 mars 2026 · 10h00';
    if (date && time) {
      const d = new Date(`${date}T${time}`);
      dateStr = d.toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      }) + ' · ' + time;
    }

    const apercu = document.querySelector(
      '.meet-schedule > div:nth-child(2) > div:nth-child(6)'
    ) || document.querySelector(
      '.meet-schedule [style*="background:var(--bg)"]'
    );
    if (!apercu) return;

    apercu.innerHTML = `
      <div style="font-weight:700;color:var(--text);margin-bottom:8px;
        font-size:11px;letter-spacing:.06em;text-transform:uppercase;">
        Aperçu email candidat
      </div>
      <p>Bonjour <strong>${nom}</strong>,</p>
      <p style="margin-top:6px;">Félicitations, tu passes à l'étape 3
        de la sélection TechPulse. Nous t'invitons à un meet présentiel :</p>
      <p style="margin-top:8px;">
        📅 <strong>${dateStr}</strong><br>
        📍 ${lieu || 'Lieu à définir'}
      </p>
      <p style="margin-top:8px;">
        Durée estimée : ${duree} minutes. Viens tel que tu es.
      </p>
      <p style="margin-top:8px;">— L'équipe TechPulse</p>`;
  }

  qs('#meet-candidate-select')?.addEventListener('change', updateApercu);
  qs('#meet-date-input')?.addEventListener('input', updateApercu);
  qs('#meet-time-input')?.addEventListener('input', updateApercu);
  qs('#meet-location-input')?.addEventListener('input', updateApercu);
  qs('#meet-duration-select')?.addEventListener('change', updateApercu);

  // ── Planifier ────────────────────────────────────────────
  const scheduleBtn = qs('#schedule-meet-btn');
  if (scheduleBtn) {
    scheduleBtn.addEventListener('click', async () => {
      const candidatId = qs('#meet-candidate-select')?.value;
      const date       = qs('#meet-date-input')?.value;
      const time       = qs('#meet-time-input')?.value;
      const lieu       = qs('#meet-location-input')?.value?.trim();
      const duree      = parseInt(qs('#meet-duration-select')?.value || '30');

      if (!candidatId || !date || !time || !lieu) {
        showToast('Remplis tous les champs', 'error');
        return;
      }

      const adminId = (() => {
        try {
          const t = sessionStorage.getItem('tp_admin_token');
          return JSON.parse(atob(t.split('.')[1])).sub;
        } catch(e) { return null; }
      })();

      scheduleBtn.disabled = true;
      scheduleBtn.textContent = 'Planification…';

      try {
        // Récupérer les infos du candidat depuis le select
        const select = qs('#meet-candidate-select');
        const selectedOption = select?.options[select.selectedIndex];
        let prenom = '', nom = '', email = '', pole = '';
        if (selectedOption) {
          const textContent = selectedOption.textContent;
          const parts = textContent.split(' · ');
          const nameParts = parts[0].trim().split(' ');
          prenom = nameParts[0] || '';
          nom = nameParts.slice(1).join(' ') || '';
          pole = (parts[1] || '').trim();
          // Récupérer l'email depuis l'option si disponible (sinon utiliser candidatId seulement)
          email = selectedOption.dataset?.email || '';
        }

        const { data, error } = await createMeet({
          candidat_id: candidatId,
          date: `${date}T${time}:00Z`,
          lieu,
          duree,
          planifie_par_admin_id: adminId
        });

        if (error) {
          showToast('Erreur : ' + (typeof error === 'string'
            ? error : JSON.stringify(error)), 'error');
          return;
        }

        // Envoyer mail si on a l'email
        if (email) {
          mailMeet({
            prenom: prenom || '',
            nom: nom || '',
            email: email || '',
            date: `${date}T${time}:00Z`,
            lieu: lieu || '',
            duree: duree || 30
          });
        }

        showToast('Meet planifié !', 'success');
        setTimeout(() => location.reload(), 1200);
      } catch(e) {
        console.error('[meets] createMeet', e);
        showToast('Erreur inattendue', 'error');
      } finally {
        scheduleBtn.disabled = false;
        scheduleBtn.textContent = 'Planifier & envoyer email';
      }
    });
  }

  // ── Candidats dans le select ─────────────────────────────
  (async () => {
    try {
      const token = sessionStorage.getItem('tp_admin_token');
      const res = await fetch(
        'https://techpulse-backend.vercel.app/api/v1/candidates/',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const raw  = await res.json();
      const list = Array.isArray(raw.data) ? raw.data
        : Array.isArray(raw) ? raw : [];

      const select = qs('#meet-candidate-select');
      if (select) {
        list.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = `${c.prenom} ${c.nom} · ${c.pole}`;
          opt.dataset.email = c.email || '';
          select.appendChild(opt);
        });

        // Pré-sélectionner si venu depuis tests.html
        if (window._preselect_candidat) {
          select.value = window._preselect_candidat;
          updateApercu();
          // Scroller vers le formulaire
          select.closest('.meet-schedule')?.scrollIntoView({ behavior: 'smooth' });
          window._preselect_candidat = null;
        }
      }
    } catch(e) {
      console.warn('[meets] candidats', e);
    }
  })();

  // ── Décision ─────────────────────────────────────────────
  window.prendreDecision = async (meetId, decision) => {
    if (!meetId) return;
    try {
      // Récupérer les infos du meet pour avoir le candidat_id
      const token = sessionStorage.getItem('tp_admin_token');
      const meetData = _allMeets.find(m => m.id === meetId);
      if (!meetData || !meetData.candidat_id) {
        showToast('Erreur et récupération des infos du candidat', 'error');
        return;
      }

      // Récupérer les infos du candidat
      const resC = await fetch(
        `https://techpulse-backend.vercel.app/api/v1/candidates/${meetData.candidat_id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      let candidatInfo = { prenom: '', nom: '', email: '', pole: '' };
      if (resC.ok) {
        const rawC = await resC.json();
        const cand = rawC.data ?? rawC;
        candidatInfo = {
          prenom: cand.prenom || '',
          nom: cand.nom || '',
          email: cand.email || '',
          pole: cand.pole || meetData.pole || ''
        };
      }

      // Enregistrer la décision
      const { error } = await recordDecision(meetId, decision);
      if (error) {
        showToast('Erreur décision', 'error');
        return;
      }

      // Mettre à jour le statut du candidat → refuse
      await fetch(
        `https://techpulse-backend.vercel.app/api/v1/candidates/${meetData.candidat_id}/statut`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ statut: 'refuse' })
        }
      ).catch(e => console.warn('[meets] statut refuse', e));

      // Envoyer l'email approprié
      if (decision === 'admis') {
        // Créer le membre automatiquement
        // Créer le membre via le service (gestion auth incluse)
        const adminId = (() => {
          try {
            const t = sessionStorage.getItem('tp_admin_token');
            return JSON.parse(atob(t.split('.')[1])).sub;
          } catch(e) { return null; }
        })();

        const { data: membreData, error: membreError } = await createMember({
          candidat_id: meetData.candidat_id,
          prenom: candidatInfo.prenom,
          nom: candidatInfo.nom,
          email: candidatInfo.email,
          pole: candidatInfo.pole,
          actif: true,
          admis_par_admin_id: adminId
        });

        if (membreError) {
          console.error('[meets] création membre échouée', membreError);
          showToast('Attention : membre non créé — ' + JSON.stringify(membreError), 'error');
        } else {
          console.log('[meets] membre créé', membreData);
        }

        console.log('[debug] createMember → data:', membreData, '| error:', membreError);

        // Mettre à jour le statut du candidat → admis
        await fetch(
          `https://techpulse-backend.vercel.app/api/v1/candidates/${meetData.candidat_id}/statut`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ statut: 'admis' })
          }
        ).catch(e => console.warn('[meets] statut admis', e));

        if (candidatInfo.email) {
          mailBienvenue({
            prenom: candidatInfo.prenom,
            nom: candidatInfo.nom,
            email: candidatInfo.email,
            pole: candidatInfo.pole
          });
        }
        showToast('Candidat admis ✓ — ajouté aux membres — email ouvert', 'success');
      } else if (decision === 'refuse') {
        if (candidatInfo.email) {
          mailRefus({
            prenom: candidatInfo.prenom,
            nom: candidatInfo.nom,
            email: candidatInfo.email,
            pole: candidatInfo.pole
          });
        }
        showToast('Candidat refusé — email ouvert', 'error');
      }

      setTimeout(() => location.reload(), 1200);
    } catch(e) {
      console.error('[meets] décision', e);
      showToast('Erreur inattendue', 'error');
    }
  };
});
