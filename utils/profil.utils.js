import { getMe, updateMe, updatePassword } from '../../services/admins.service.js';
import { getAdminName, setAdminName, clearSession } from './auth.utils.js';
import { qs } from './dom.utils.js';
import { showToast } from './toast.utils.js';

const PHOTO_KEY = 'tp_admin_photo';

export function initProfilModal() {

  // Charger photo depuis localStorage
  const savedPhoto = localStorage.getItem(PHOTO_KEY);
  updateAvatarDisplay(savedPhoto);

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
    qs('#tab-infos').style.display     = tab === 'infos'     ? '' : 'none';
    qs('#tab-password').style.display  = tab === 'password'  ? '' : 'none';
  };

  window.handlePhotoChange = (input) => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      localStorage.setItem(PHOTO_KEY, dataUrl);
      updateAvatarDisplay(dataUrl);
      showToast('Photo mise à jour ✓');
    };
    reader.readAsDataURL(file);
  };

  window.saveProfil = async () => {
    const prenom = qs('#profil-prenom')?.value.trim();
    const nom    = qs('#profil-nom')?.value.trim();
    const email  = qs('#profil-email')?.value.trim();

    if (!prenom || !nom || !email) {
      showToast('Remplis tous les champs', 'error'); return;
    }

    const btn = qs('#save-profil-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sauvegarde…'; }

    const { error } = await updateMe({ prenom, nom, email });

    if (btn) { btn.disabled = false; btn.textContent = 'Sauvegarder les modifications'; }

    if (error) { showToast('Erreur : ' + error, 'error'); return; }

    const fullName = `${prenom} ${nom}`.trim();
    setAdminName(fullName);
    const nameEl = qs('#sidebar-user-name');
    if (nameEl) nameEl.textContent = fullName;
    const avatarEl = qs('#sidebar-avatar');
    if (avatarEl && !localStorage.getItem(PHOTO_KEY)) {
      avatarEl.textContent = fullName.charAt(0).toUpperCase();
    }

    showToast('Profil mis à jour ✓');
    window.closeModal('profil-modal');
  };

  window.savePassword = async () => {
    const current = qs('#profil-pwd-current')?.value;
    const newPwd  = qs('#profil-pwd-new')?.value;
    const confirm = qs('#profil-pwd-confirm')?.value;

    if (!current) { showToast('Entre ton mot de passe actuel', 'error'); return; }
    if (!newPwd || newPwd.length < 8) {
      showToast('Nouveau mot de passe trop court (min. 8 car.)', 'error'); return;
    }
    if (newPwd !== confirm) {
      showToast('Les mots de passe ne correspondent pas', 'error'); return;
    }

    const { error } = await updatePassword({ 
      mot_de_passe_actuel: current, 
      nouveau_mot_de_passe: newPwd 
    });

    if (error) { showToast('Erreur : ' + error, 'error'); return; }
    showToast('Mot de passe modifié ✓');
    qs('#profil-pwd-current').value = '';
    qs('#profil-pwd-new').value = '';
    qs('#profil-pwd-confirm').value = '';
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

  // Pré-remplir avec les données en session
  const adminName = getAdminName() || '';
  const parts = adminName.split(' ');
  if (qs('#profil-prenom')) qs('#profil-prenom').value = parts[0] || '';
  if (qs('#profil-nom'))    qs('#profil-nom').value    = parts.slice(1).join(' ') || '';

  // Charger depuis l'API pour avoir l'email
  try {
    const { data } = await getMe();
    const admin = data?.admin ?? data ?? {};
    if (qs('#profil-prenom')) qs('#profil-prenom').value = admin.prenom || parts[0] || '';
    if (qs('#profil-nom'))    qs('#profil-nom').value    = admin.nom    || parts.slice(1).join(' ') || '';
    if (qs('#profil-email'))  qs('#profil-email').value  = admin.email  || '';
  } catch(e) {
    console.warn('[profil] impossible de charger le profil', e);
  }
}

function updateAvatarDisplay(photoUrl) {
  const sidebarAvatar  = qs('#sidebar-avatar');
  const profilAvatar   = qs('#profil-avatar-display');
  const adminName      = getAdminName() || 'A';
  const initial        = adminName.charAt(0).toUpperCase();

  if (photoUrl) {
    const imgStyle = `width:100%;height:100%;object-fit:cover;border-radius:50%;`;
    if (sidebarAvatar) sidebarAvatar.innerHTML = 
      `<img src="${photoUrl}" style="${imgStyle}" alt="avatar">`;
    if (profilAvatar)  profilAvatar.innerHTML  = 
      `<img src="${photoUrl}" style="${imgStyle}" alt="avatar">`;
  } else {
    if (sidebarAvatar) sidebarAvatar.textContent = initial;
    if (profilAvatar)  profilAvatar.textContent  = initial;
  }
}
