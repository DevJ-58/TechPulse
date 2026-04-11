/**
 * Vérifie si le token est valide et non vide
 * @param {string|null} token
 * @returns {boolean}
 */
function isValidToken(token) {
  if (!token) return false;
  const t = String(token).trim().toLowerCase();
  return t !== '' && t !== 'null' && t !== 'undefined';
}

/**
 * Vérifie si un admin est connecté (token présent et non expiré)
 * @returns {boolean}
 */
export function isAdminLoggedIn() {
  const token = sessionStorage.getItem('tp_admin_token');
  // TODO: vérifier expiration JWT si besoin
  return isValidToken(token);
}

/**
 * Redirige vers login.html si non connecté
 */
export function requireAdmin() {
  if (!isAdminLoggedIn()) {
    window.location.href = 'login.html';
  }
}

/**
 * Retourne le token admin
 * @returns {string|null}
 */
export function getAdminToken() {
  return sessionStorage.getItem('tp_admin_token');
}

/**
 * Retourne le nom de l'admin
 * @returns {string|null}
 */
export function getAdminName() {
  return sessionStorage.getItem('tp_admin_name');
}

/**
 * Stocke le nom de l'admin
 * @param {string} name
 */
export function setAdminName(name) {
  if (!name) return;
  sessionStorage.setItem('tp_admin_name', name);
}

/**
 * Efface la session
 */
export function clearSession() {
  // Garder la photo en localStorage — elle est liée à l'appareil
  // pas à la session
  sessionStorage.clear();
  // NE PAS toucher localStorage ici
}

/**
 * Retourne le rôle de l'admin depuis le JWT ou sessionStorage
 * @returns {string|null}
 */
export function getAdminRole() {
  try {
    const token = sessionStorage.getItem('tp_admin_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || sessionStorage.getItem('tp_admin_role') || null;
  } catch(e) {
    return null;
  }
}

/**
 * Vérifie si l'admin a accès à une page donnée
 * @param {string} page - identifiant de la page
 * @returns {boolean}
 */
export function hasAccess(page) {
  const role = getAdminRole() || 'presi'; // Fallback pour comptes anciens
  if (!role) return false;
  const ROLE_ACCESS = {
    presi: ['dashboard','candidatures','tests','meets','membres','annonces','editeur','parametres'],
    TD:    ['dashboard','membres'],
    RO:    ['dashboard','candidatures'],
    CI:    ['dashboard','tests','editeur'],
    OS:    ['dashboard','meets','membres'],
  };
  return (ROLE_ACCESS[role] || []).includes(page);
}

