import { hasAccess } from '../../../utils/auth.utils.js';

export function applySidebarGuard() {
  const linkMap = {
    'nl-dashboard': 'dashboard',
    'nl-cand':      'candidatures',
    'nl-tests':     'tests',
    'nl-meets':     'meets',
    'nl-membres':   'membres',
    'nl-annonces':  'annonces',
    'nl-editeur':   'editeur',
    'nl-params':    'parametres',
  };

  Object.entries(linkMap).forEach(([id, page]) => {
    const link = document.getElementById(id);
    if (!link) return;
    if (!hasAccess(page)) {
      link.style.opacity = '0.35';
      link.style.pointerEvents = 'none';
      link.style.cursor = 'not-allowed';
      link.title = 'Non autorisé pour ton rôle';
      // Supprimer le badge de count pour ne pas induire en erreur
      const badge = link.querySelector('.sidebar-badge');
      if (badge) badge.style.display = 'none';
    }
  });
}