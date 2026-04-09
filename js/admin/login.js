import { isAdminLoggedIn, setAdminName } from '../../utils/auth.utils.js';
import { login } from '../../services/admins.service.js';
import { showToast } from '../../utils/toast.utils.js';
import { qs, setLoading } from '../../utils/dom.utils.js';

console.log('login.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('login DOMContentLoaded');
  if (isAdminLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }
  const form = qs('#login-form');
  console.log('form:', form);
  if (form) {
    form.addEventListener('submit', async e => {
      console.log('form submit event');
      e.preventDefault();
      console.log('preventDefault called');
      setLoading(form.querySelector('button[type=submit]'), true);
      const email = form.email.value;
      const mot_de_passe = form.pwd.value;
      console.log('Tentative de login', email, mot_de_passe);
      try {
        const { data, error, status } = await login(email, mot_de_passe);
        console.log('Résultat login', data, error, status);
        setLoading(form.querySelector('button[type=submit]'), false);
        if (data?.jetons?.token_acces || data?.token_acces || data?.token) {
          console.log('[login] login success, redirecting to dashboard.html');
          // La photo reste en localStorage entre sessions
          // Rien à faire — localStorage persiste entre déconnexions
          window.location.href = 'dashboard.html';
        } else if (status === 401) {
          showToast('Identifiants incorrects', 'error');
        } else {
          showToast(error || 'Erreur de connexion', 'error');
        }
      } catch (err) {
        setLoading(form.querySelector('button[type=submit]'), false);
        console.error('Erreur login', err);
        showToast('Erreur JS : ' + err.message, 'error');
      }
    });
  }
});

