// Inline qs
const qs = (sel) => document.querySelector(sel);

// Inline showToast  
const showToast = (msg, type = 'info') => {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type === 'error' ? ' toast-error' : '');
  setTimeout(() => t.classList.remove('show'), 3500);
};

// Inline register — appel direct fetch sans passer par api.service.js
const register = async (payload) => {
  try {
    const res = await fetch(
      'https://124f-102-206-123-155.ngrok-free.app/api/v1/admins/inscription',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { 
        data: null, 
        error: data?.detail || 'Erreur lors de la création', 
        status: res.status 
      };
    }
    return { data, error: null, status: res.status };
  } catch(e) {
    return { data: null, error: e.message, status: 0 };
  }
};

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
        // Afficher dans le div d'erreur ET en toast
        const errorEl = qs('#register-error');
        if (errorEl) {
          errorEl.textContent = error;
          errorEl.classList.add('show');
        }
        showToast(error, 'error');
        return;
      }

      // Cacher l'erreur si succès
      const errorEl = qs('#register-error');
      if (errorEl) errorEl.classList.remove('show');

      showToast('Compte créé avec succès ! Redirection…');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    });
  }
});
