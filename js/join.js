import { createCandidate } from '../services/candidates.service.js';
import { showToast } from '../utils/toast.utils.js';
import { qs, qsa, setLoading, clearForm } from '../utils/dom.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // Burger menu functionality
  const burger = qs('#burger');
  const mobileNav = qs('#nav-mobile');

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });
  }

  const form         = qs('#join-form');
  const steps        = Array.from(qsa('.form-step'));
  const nextBtns     = Array.from(qsa('[id^="btn-next"]'));
  const prevBtns     = Array.from(qsa('[id^="btn-prev"]'));
  const successState = qs('#success');
  const formContent  = qs('#form-content');
  const stepLabel    = qs('#step-label');
  const dots         = Array.from(qsa('.stepper-dot'));
  let currentStep    = 0;

  function validateFormData(data) {
    // Trim values
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') data[key] = data[key].trim();
    });
    
    // Required fields
    const required = ['nom', 'prenom', 'email', 'filiere', 'niveau', 'pole', 'motivation'];
    for (const field of required) {
      if (!data[field]) return `Le champ ${field} est obligatoire.`;
    }
    
    // Name and prenom length
    if (data.nom.length < 2) return 'Le nom doit contenir au moins 2 caractères.';
    if (data.prenom.length < 2) return 'Le prénom doit contenir au moins 2 caractères.';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) return 'Adresse email invalide.';
    
    // Niveau validation
    const validNiveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
    if (!validNiveaux.includes(data.niveau)) return 'Niveau invalide.';
    
    // Pole validation
    const validPoles = ['dev', 'secu', 'iot'];
    if (!validPoles.includes(data.pole)) return 'Pôle invalide.';
    
    // Motivation length
    if (data.motivation.length < 20) return 'La motivation doit contenir au moins 20 caractères.';
    
    return null; // No error
  }

  function showStep(idx) {
    steps.forEach((step, i) => {
      if (i === idx) {
        step.style.display = '';
        step.classList.add('active');
      } else {
        step.style.display = 'none';
        step.classList.remove('active');
      }
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
      dot.classList.toggle('completed', i < idx);
    });

    if (stepLabel) stepLabel.textContent = `${idx + 1} sur 3`;
    currentStep = idx;
  }

  const btnNext1 = qs('#btn-next-1');
  const btnNext2 = qs('#btn-next-2');
  const btnPrev2 = qs('#btn-prev-2');
  const btnPrev3 = qs('#btn-prev-3');

  if (btnNext1) {
    btnNext1.addEventListener('click', e => {
      e.preventDefault();
      const nom = qs('input[name="nom"]')?.value.trim() || '';
      const prenom = qs('input[name="prenom"]')?.value.trim() || '';
      const email = qs('input[name="email"]')?.value.trim() || '';
      const filiere = qs('select[name="filiere"]')?.value.trim() || '';
      const niveau = qs('select[name="niveau"]')?.value.trim() || '';
      
      // Vérifications
      if (!nom || nom.length < 2) {
        showToast('Nom invalide (min 2 caractères)', 'error');
        return;
      }
      if (!prenom || prenom.length < 2) {
        showToast('Prénom invalide (min 2 caractères)', 'error');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showToast('Email invalide', 'error');
        return;
      }
      if (!filiere) {
        showToast('Veuillez sélectionner une filière', 'error');
        return;
      }
      if (!niveau) {
        showToast('Veuillez sélectionner votre niveau', 'error');
        return;
      }
      showStep(1);
    });
  }

  if (btnNext2) {
    btnNext2.addEventListener('click', e => {
      e.preventDefault();
      const pole = qs('input[name="pole"]:checked')?.value;
      if (!pole) {
        showToast('Veuillez sélectionner un pôle', 'error');
        return;
      }
      showStep(2);
    });
  }

  if (btnPrev2) {
    btnPrev2.addEventListener('click', e => {
      e.preventDefault();
      showStep(0);
    });
  }

  if (btnPrev3) {
    btnPrev3.addEventListener('click', e => {
      e.preventDefault();
      showStep(1);
    });
  }

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const formData = Object.fromEntries(new FormData(form));
      console.log('[join] formData brut →', formData);

      // Normaliser niveau_tech
      const niveauTechMap = {
        "Débutant (j'explore)": "debutant",
        "Intermédiaire (j'ai des bases)": "intermediaire",
        "Avancé (je pratique régulièrement)": "avance",
      };
      if (formData.niveau_tech) {
        formData.niveau_tech = niveauTechMap[formData.niveau_tech] || formData.niveau_tech;
      }

      // Normaliser source
      const sourceMap = {
        "Bouche à oreille": "bouche_a_oreille",
        "Réseaux sociaux": "reseaux_sociaux",
        "Campus / affiches": "campus",
        "Un membre du club": "membre",
        "Autre": "autre",
      };
      if (formData.source) {
        formData.source = sourceMap[formData.source] || formData.source;
      }

      // Renommer projet → projet_cite
      if (formData.projet !== undefined) {
        formData.projet_cite = formData.projet;
        delete formData.projet;
      }

      const validationError = validateFormData(formData);
      if (validationError) {
        showToast(validationError, 'error');
        return;
      }

      const submitBtn = qs('#btn-submit');
      if (submitBtn) submitBtn.disabled = true;

      console.log('[join] payload envoyé →', formData);
      const { data, error, status } = await createCandidate(formData);
      console.log('[join] réponse →', { data, error, status });

      if (submitBtn) submitBtn.disabled = false;

      if (data && !error) {
        if (formContent) formContent.style.display = 'none';
        if (successState) {
          successState.style.cssText = 'display:flex !important;';
          if (window.lucide) lucide.createIcons();
        }
      } else {
        const msg = error || `Erreur ${status || ''}`;
        showToast(msg, 'error');
      }
    });
  }

  showStep(0);
});
