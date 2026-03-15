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

  let currentStep = 0;
  const steps = qsa('.form-step');
  const nextBtns = qsa('.btn-next');
  const prevBtns = qsa('.btn-prev');
  const form = qs('#join-form');
  const successState = qs('.join-success');

  function showStep(idx) {
    steps.forEach((step, i) => step.style.display = (i === idx ? '' : 'none'));
    currentStep = idx;
  }

  nextBtns.forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    if (currentStep < steps.length - 1) showStep(currentStep + 1);
  }));
  prevBtns.forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    if (currentStep > 0) showStep(currentStep - 1);
  }));

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      setLoading(form.querySelector('button[type=submit]'), true);
      const formData = Object.fromEntries(new FormData(form));
      const { data, error } = await createCandidate(formData);
      setLoading(form.querySelector('button[type=submit]'), false);
      if (data) {
        form.style.display = 'none';
        if (successState) successState.style.display = '';
      } else {
        showToast(error || 'Erreur lors de la soumission', 'error');
      }
    });
  }

  showStep(0);
});
