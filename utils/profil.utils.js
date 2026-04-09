import { getMe, updateMe, updatePassword } from '../../services/admins.service.js';
import { getAdminName, setAdminName, clearSession } from './auth.utils.js';
import { qs } from './dom.utils.js';
import { showToast } from './toast.utils.js';

const PHOTO_KEY = 'tp_admin_photo';

export function initProfilModal() {

  // Charger photo et nom depuis localStorage au démarrage
  const savedPhoto = localStorage.getItem(PHOTO_KEY);
  console.log('[profil] photo trouvée ?', !!savedPhoto);
  const adminName  = getAdminName() || 'Admin';
  updateAvatarDisplay(savedPhoto, adminName);

  // Mettre à jour le nom dans la sidebar
  const nameEl = qs('#sidebar-user-name');
  if (nameEl && adminName) nameEl.textContent = adminName;

  // Clic sur sidebar-user-trigger ouvre la modale
  const trigger = qs('#sidebar-user-trigger');
  if (trigger) {
    trigger.addEventListener('click', async (e) => {
      if (e.target.closest('#logout-btn')) return;
      await openProfilModal();
    });
  }

  // Logout btn
  const logoutBtn = qs('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      doLogout();
    });
  }

  window.closeModal = window.closeModal || ((id) => {
    const el = qs('#' + id);
    if (el) { el.style.display = 'none'; el.classList.remove('show'); }
  });

  window.switchProfilTab = (btn, tab) => {
    document.querySelectorAll('#profil-modal .filter-btn')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    qs('#tab-infos').style.display    = tab === 'infos'    ? '' : 'none';
    qs('#tab-password').style.display = tab === 'password' ? '' : 'none';
  };

  // Gestion upload photo
  window.handlePhotoChange = (input) => {
    const file = input.files[0];
    if (!file) return;

    // Vérifier taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Photo trop lourde (max 2MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      localStorage.setItem(PHOTO_KEY, dataUrl);
      const adminName = getAdminName() || 'Admin';
      updateAvatarDisplay(dataUrl, adminName);
      showToast('Photo mise à jour ✓');
      // Mettre à jour aussi dans la modale
      const profilAvatar = qs('#profil-avatar-display');
      if (profilAvatar) {
        profilAvatar.innerHTML = 
          `<img src="${dataUrl}" style="width:100%;height:100%;
           object-fit:cover;border-radius:50%;" alt="avatar">`;
      }
    };
    reader.readAsDataURL(file);
  };

  // Sauvegarde profil
  window.saveProfil = async () => {
    const prenom = qs('#profil-prenom')?.value.trim();
    const nom    = qs('#profil-nom')?.value.trim();
    const email  = qs('#profil-email')?.value.trim();

    console.log('[saveProfil] valeurs →', { prenom, nom, email });

    if (!prenom || prenom.length < 2) {
      showToast('Prénom invalide', 'error'); return;
    }
    if (!nom || nom.length < 2) {
      showToast('Nom invalide', 'error'); return;
    }

    const btn = qs('#save-profil-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde…'; }

    try {
      const result = await updateMe({ prenom, nom, email });
      console.log('[saveProfil] résultat updateMe →', JSON.stringify(result));
      const { error } = result;

      if (btn) { 
        btn.disabled = false; 
        btn.textContent = 'Sauvegarder les modifications'; 
      }

      if (error) { 
        showToast('Erreur : ' + error, 'error'); 
        return; 
      }

      // Mettre à jour en local
      const fullName = `${prenom} ${nom}`.trim();
      setAdminName(fullName);

      // Mettre à jour la sidebar
      const nameEl = qs('#sidebar-user-name');
      if (nameEl) nameEl.textContent = fullName;

      // Mettre à jour l'avatar si pas de photo
      const savedPhoto = localStorage.getItem(PHOTO_KEY);
      updateAvatarDisplay(savedPhoto, fullName);

      showToast('Profil mis à jour ✓');
      window.closeModal('profil-modal');

    } catch(e) {
      if (btn) { 
        btn.disabled = false; 
        btn.textContent = 'Sauvegarder les modifications'; 
      }
      showToast('Erreur inattendue : ' + e.message, 'error');
    }
  };

  // Changement mot de passe
  window.savePassword = async () => {
    const current = qs('#profil-pwd-current')?.value;
    const newPwd  = qs('#profil-pwd-new')?.value;
    const confirm = qs('#profil-pwd-confirm')?.value;

    if (!current) { 
      showToast('Entre ton mot de passe actuel', 'error'); return; 
    }
    if (!newPwd || newPwd.length < 8) {
      showToast('Nouveau mot de passe trop court (min. 8 car.)', 'error'); return;
    }
    if (newPwd !== confirm) {
      showToast('Les mots de passe ne correspondent pas', 'error'); return;
    }

    const btn = qs('#save-password-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Modification…'; }

    try {
      const { error } = await updatePassword({
        mot_de_passe_actuel:  current,
        nouveau_mot_de_passe: newPwd,
      });

      if (btn) { btn.disabled = false; btn.textContent = 'Changer le mot de passe'; }

      if (error) { showToast('Erreur : ' + error, 'error'); return; }

      showToast('Mot de passe modifié ✓');
      qs('#profil-pwd-current').value = '';
      qs('#profil-pwd-new').value     = '';
      qs('#profil-pwd-confirm').value = '';

    } catch(e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Changer le mot de passe'; }
      showToast('Erreur inattendue : ' + e.message, 'error');
    }
  };

  window.doLogout = () => {
    clearSession();
    window.location.href = 'login.html';
  };
}

async function openProfilModal() {
  const modal = qs('#profil-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  // Reset tabs
  window.switchProfilTab(
    document.querySelector('#profil-modal .filter-btn'), 
    'infos'
  );

  // Pré-remplir depuis localStorage d'abord
  const adminName = getAdminName() || '';
  const parts     = adminName.trim().split(' ');
  const prenom    = parts[0] || '';
  const nom       = parts.slice(1).join(' ') || '';

  if (qs('#profil-prenom')) qs('#profil-prenom').value = prenom;
  if (qs('#profil-nom'))    qs('#profil-nom').value    = nom;

  // Mettre à jour l'avatar dans la modale
  const savedPhoto = localStorage.getItem(PHOTO_KEY);
  const profilAvatar = qs('#profil-avatar-display');
  if (profilAvatar) {
    if (savedPhoto) {
      profilAvatar.innerHTML = 
        `<img src="${savedPhoto}" 
         style="width:100%;height:100%;object-fit:cover;border-radius:50%;" 
         alt="avatar">`;
    } else {
      profilAvatar.textContent = adminName.charAt(0).toUpperCase() || 'A';
    }
  }

  // Charger depuis l'API pour avoir l'email à jour
  try {
    const { data } = await getMe();
    const admin = data?.admin ?? data ?? {};
    if (qs('#profil-prenom') && admin.prenom) 
      qs('#profil-prenom').value = admin.prenom;
    if (qs('#profil-nom') && admin.nom)       
      qs('#profil-nom').value    = admin.nom;
    if (qs('#profil-email') && admin.email)   
      qs('#profil-email').value  = admin.email;
  } catch(e) {
    console.warn('[profil] impossible de charger depuis API', e);
  }
}

function updateAvatarDisplay(photoUrl, adminName) {
  const name    = adminName || getAdminName() || 'Admin';
  const initial = name.charAt(0).toUpperCase();

  const sidebarAvatar = qs('#sidebar-avatar');
  const profilAvatar  = qs('#profil-avatar-display');

  if (photoUrl) {
    const imgHtml = `<img src="${photoUrl}" 
      style="width:100%;height:100%;object-fit:cover;border-radius:50%;" 
      alt="avatar">`;
    if (sidebarAvatar) sidebarAvatar.innerHTML = imgHtml;
    if (profilAvatar)  profilAvatar.innerHTML  = imgHtml;
  } else {
    if (sidebarAvatar) sidebarAvatar.textContent = initial;
    if (profilAvatar)  profilAvatar.textContent  = initial;
  }
}

