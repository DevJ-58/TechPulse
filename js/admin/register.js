import { register } from '../../services/admins.service.js';
import { qs } from '../../utils/dom.utils.js';
import { showToast } from '../../utils/toast.utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const form        = qs('#register-form');
  const submitBtn   = qs('#register-btn');
  const prenomEl    = qs('#prenom');
  const nomEl       = qs('#nom');
  const emailEl     = qs('#email');
  const passwordEl  = qs('#password');
  const confirmEl   = qs('#confirm-password');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const prenom   = prenomEl?.value.trim();
      const nom      = nomEl?.value.trim();
      const email    = emailEl?.value.trim();
      const password = passwordEl?.value;
      const confirm  = confirmEl?.value;

      if (!prenom || prenom.length < 2) {
        showToast('Prénom invalide', 'error'); return;
      }
      if (!nom || nom.length < 2) {
        showToast('Nom invalide', 'error'); return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showToast('Email invalide', 'error'); return;
      }
      if (!password || password.length < 8) {
        showToast('Mot de passe trop court (min. 8 caractères)', 'error'); return;
      }
      if (password !== confirm) {
        showToast('Les mots de passe ne correspondent pas', 'error'); return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Création…'; }

      const { data, error, status } = await register({
        prenom,
        nom,
        email,
        mot_de_passe: password,
      });

      console.log('[register] réponse →', { data, error, status });

      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Créer le compte'; }

      if (error) {
        showToast(error || 'Erreur lors de la création', 'error');
        return;
      }

      showToast('Compte créé avec succès ! Redirection…');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    });
  }
});
