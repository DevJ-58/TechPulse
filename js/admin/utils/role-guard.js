import { hasAccess, getAdminRole } from '../../../utils/auth.utils.js';

export function guardPage(pageId, pageTitle) {
  const role = getAdminRole() || 'presi'; // Fallback pour comptes anciens
  if (hasAccess(pageId)) return; // accès autorisé → rien à faire

  // Laisser la sidebar intacte
  // Remplacer uniquement le contenu de .content
  const contentZone = document.querySelector('.content');
  if (!contentZone) return;

  // Libellés lisibles par rôle
  const roleLabels = {
    presi: 'Président',
    TD:    'Tech & Développement',
    RO:    'Relations & Opportunités',
    CI:    'Communication & Image',
    OS:    'Organisation & Suivi',
  };

  contentZone.innerHTML = `
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      min-height:70vh;
      padding:40px 20px;
    ">
      <div style="
        text-align:center;
        max-width:460px;
        background:var(--surface);
        border:1.5px solid var(--border);
        border-radius:var(--radius-lg);
        padding:48px 40px;
      ">
        <div style="
          width:56px;height:56px;
          border-radius:50%;
          background:var(--danger-bg);
          border:1.5px solid rgba(204,34,0,.15);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 20px;
          font-size:22px;
        ">🔒</div>

        <div style="
          font-family:var(--font-display);
          font-size:18px;
          font-weight:800;
          letter-spacing:-.3px;
          margin-bottom:10px;
          color:var(--text);
        ">
          Accès non autorisé
        </div>

        <div style="
          font-size:13px;
          color:var(--muted);
          line-height:1.7;
          margin-bottom:24px;
        ">
          Tu n'es pas habilité à consulter le contenu de cette page.<br>
          Ton rôle actuel est <strong style="color:var(--text);">
            ${roleLabels[role] || role}
          </strong>, qui ne couvre pas la section
          <strong style="color:var(--text);">${pageTitle || pageId}</strong>.<br><br>
          Si tu penses qu'il s'agit d'une erreur, contacte
          <strong style="color:var(--text);">Djeke</strong>.
        </div>

        <a href="dashboard.html" class="btn btn-outline" style="font-size:13px;">
          ← Retour au dashboard
        </a>
      </div>
    </div>`;
}