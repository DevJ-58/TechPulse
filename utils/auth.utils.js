/**
 * Vérifie si un admin est connecté (token présent et non expiré)
 * @returns {boolean}
 */
export function isAdminLoggedIn() {
  const token = sessionStorage.getItem('tp_admin_token');
  // TODO: vérifier expiration JWT si besoin
  return !!token;
}

/**
 * Redirige vers /admin/login.html si non connecté
 */
export function requireAdmin() {
  if (!isAdminLoggedIn()) {
    window.location.href = '/admin/login.html';
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
 * Efface la session
 */
export function clearSession() {
  sessionStorage.clear();
}
